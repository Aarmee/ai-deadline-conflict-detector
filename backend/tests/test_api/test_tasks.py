"""Tests for Task endpoints."""
import pytest
from datetime import date, timedelta


TOMORROW = (date.today() + timedelta(days=5)).isoformat()
NEXT_WEEK = (date.today() + timedelta(days=10)).isoformat()


@pytest.mark.asyncio
async def test_create_task_success(auth_client):
    resp = await auth_client.post("/api/v1/tasks", json={
        "title": "Write project report",
        "deadline": TOMORROW,
        "estimated_effort_hours": 5.0,
        "priority": "HIGH",
        "category": "Academic",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["task"]["title"] == "Write project report"
    assert data["task"]["status"] == "PENDING"
    assert "prediction" in data
    assert data["prediction"]["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0 <= data["prediction"]["probability_score"] <= 1


@pytest.mark.asyncio
async def test_create_task_missing_required_field(auth_client):
    resp = await auth_client.post("/api/v1/tasks", json={
        "title": "Incomplete task",
        # missing deadline and estimated_effort_hours
        "priority": "LOW",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_tasks_empty(auth_client):
    resp = await auth_client.get("/api/v1/tasks")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_tasks_with_data(auth_client):
    # Create 2 tasks
    for i in range(2):
        await auth_client.post("/api/v1/tasks", json={
            "title": f"Task {i}",
            "deadline": NEXT_WEEK,
            "estimated_effort_hours": 3.0,
            "priority": "MEDIUM",
        })
    resp = await auth_client.get("/api/v1/tasks")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_task_by_id(auth_client):
    create = await auth_client.post("/api/v1/tasks", json={
        "title": "Specific task",
        "deadline": TOMORROW,
        "estimated_effort_hours": 2.0,
        "priority": "LOW",
    })
    task_id = create.json()["task"]["id"]

    resp = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == task_id


@pytest.mark.asyncio
async def test_get_task_not_found(auth_client):
    resp = await auth_client.get("/api/v1/tasks/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_task(auth_client):
    create = await auth_client.post("/api/v1/tasks", json={
        "title": "Old title",
        "deadline": TOMORROW,
        "estimated_effort_hours": 2.0,
        "priority": "LOW",
    })
    task_id = create.json()["task"]["id"]

    resp = await auth_client.patch(f"/api/v1/tasks/{task_id}", json={"title": "New title"})
    assert resp.status_code == 200
    assert resp.json()["task"]["title"] == "New title"


@pytest.mark.asyncio
async def test_complete_task(auth_client):
    create = await auth_client.post("/api/v1/tasks", json={
        "title": "Task to complete",
        "deadline": TOMORROW,
        "estimated_effort_hours": 1.0,
        "priority": "MEDIUM",
    })
    task_id = create.json()["task"]["id"]

    resp = await auth_client.post(f"/api/v1/tasks/{task_id}/complete")
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"
    assert resp.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_start_task(auth_client):
    create = await auth_client.post("/api/v1/tasks", json={
        "title": "Task to start",
        "deadline": TOMORROW,
        "estimated_effort_hours": 1.0,
        "priority": "HIGH",
    })
    task_id = create.json()["task"]["id"]

    resp = await auth_client.post(f"/api/v1/tasks/{task_id}/start")
    assert resp.status_code == 200
    assert resp.json()["status"] == "IN_PROGRESS"


@pytest.mark.asyncio
async def test_delete_task(auth_client):
    create = await auth_client.post("/api/v1/tasks", json={
        "title": "Delete me",
        "deadline": TOMORROW,
        "estimated_effort_hours": 1.0,
        "priority": "LOW",
    })
    task_id = create.json()["task"]["id"]

    resp = await auth_client.delete(f"/api/v1/tasks/{task_id}")
    assert resp.status_code == 204

    get = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_create_subtask(auth_client):
    parent = await auth_client.post("/api/v1/tasks", json={
        "title": "Parent task",
        "deadline": NEXT_WEEK,
        "estimated_effort_hours": 10.0,
        "priority": "HIGH",
    })
    parent_id = parent.json()["task"]["id"]

    resp = await auth_client.post(f"/api/v1/tasks/{parent_id}/subtasks", json={
        "title": "Subtask 1",
        "deadline": TOMORROW,
        "estimated_effort_hours": 3.0,
        "priority": "MEDIUM",
    })
    assert resp.status_code == 201
    assert resp.json()["task"]["parent_task_id"] == parent_id


@pytest.mark.asyncio
async def test_filter_tasks_by_priority(auth_client):
    await auth_client.post("/api/v1/tasks", json={
        "title": "High priority", "deadline": TOMORROW,
        "estimated_effort_hours": 2.0, "priority": "HIGH",
    })
    await auth_client.post("/api/v1/tasks", json={
        "title": "Low priority", "deadline": TOMORROW,
        "estimated_effort_hours": 2.0, "priority": "LOW",
    })
    resp = await auth_client.get("/api/v1/tasks?priority=HIGH")
    assert resp.status_code == 200
    assert all(t["priority"] == "HIGH" for t in resp.json())
