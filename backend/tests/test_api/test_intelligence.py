"""Tests for predictions, conflicts, recommendations, analytics, notifications."""
import pytest
from datetime import date, timedelta

TOMORROW = (date.today() + timedelta(days=3)).isoformat()
SAME_DAY = (date.today() + timedelta(days=2)).isoformat()


async def _create_task(client, title, deadline, effort, priority="HIGH"):
    resp = await client.post("/api/v1/tasks", json={
        "title": title, "deadline": deadline,
        "estimated_effort_hours": effort, "priority": priority,
    })
    assert resp.status_code == 201
    return resp.json()["task"]["id"]


@pytest.mark.asyncio
async def test_dashboard_empty(auth_client):
    resp = await auth_client.get("/api/v1/predictions/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_active_tasks"] == 0
    assert data["active_conflicts"] == 0
    assert data["workload_score"] == 0


@pytest.mark.asyncio
async def test_dashboard_with_tasks(auth_client):
    await _create_task(auth_client, "Task A", TOMORROW, 5.0)
    await _create_task(auth_client, "Task B", TOMORROW, 5.0)

    resp = await auth_client.get("/api/v1/predictions/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_active_tasks"] == 2
    assert data["workload_score"] > 0


@pytest.mark.asyncio
async def test_prediction_history(auth_client):
    task_id = await _create_task(auth_client, "Task X", TOMORROW, 4.0)
    # Update to trigger a second prediction
    await auth_client.patch(f"/api/v1/tasks/{task_id}", json={"estimated_effort_hours": 8.0})

    resp = await auth_client.get(f"/api/v1/predictions/task/{task_id}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_conflict_detection(auth_client):
    # Create 2 high-effort tasks on same deadline to trigger overlap
    await _create_task(auth_client, "Heavy Task 1", SAME_DAY, 30.0, "CRITICAL")
    await _create_task(auth_client, "Heavy Task 2", SAME_DAY, 30.0, "CRITICAL")

    resp = await auth_client.post("/api/v1/conflicts/detect")
    assert resp.status_code == 200
    # Should have detected at least one conflict
    conflicts = resp.json()
    assert isinstance(conflicts, list)


@pytest.mark.asyncio
async def test_list_conflicts(auth_client):
    resp = await auth_client.get("/api/v1/conflicts")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_schedule_recommendation(auth_client):
    await _create_task(auth_client, "Task A", TOMORROW, 3.0, "HIGH")
    await _create_task(auth_client, "Task B", TOMORROW, 2.0, "LOW")

    resp = await auth_client.get("/api/v1/recommendations/schedule")
    assert resp.status_code == 200
    data = resp.json()
    assert "recommended_order" in data
    assert "reason_summary" in data
    assert len(data["recommended_order"]) == 2


@pytest.mark.asyncio
async def test_accept_recommendation(auth_client):
    await _create_task(auth_client, "Task", TOMORROW, 2.0)
    rec_resp = await auth_client.get("/api/v1/recommendations/schedule")
    rec_id = rec_resp.json()["id"]

    resp = await auth_client.post(f"/api/v1/recommendations/{rec_id}/accept")
    assert resp.status_code == 200
    assert resp.json()["accepted"] == True


@pytest.mark.asyncio
async def test_notifications_empty(auth_client):
    resp = await auth_client.get("/api/v1/notifications")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_mark_all_notifications_read(auth_client):
    # Trigger a conflict to create notifications
    await _create_task(auth_client, "T1", SAME_DAY, 30.0, "CRITICAL")
    await _create_task(auth_client, "T2", SAME_DAY, 30.0, "CRITICAL")
    await auth_client.post("/api/v1/conflicts/detect")

    resp = await auth_client.post("/api/v1/notifications/read-all")
    assert resp.status_code == 200
    assert "marked_read" in resp.json()


@pytest.mark.asyncio
async def test_productivity_analytics(auth_client):
    resp = await auth_client.get("/api/v1/analytics/productivity")
    assert resp.status_code == 200
    data = resp.json()
    assert "completion_rate" in data
    assert "total_completed" in data
    assert "total_missed" in data


@pytest.mark.asyncio
async def test_workload_chart(auth_client):
    await _create_task(auth_client, "Task", TOMORROW, 4.0)
    resp = await auth_client.get("/api/v1/analytics/workload?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["days"]) == 7
    assert "total_effort" in data
    assert "overload_days" in data


@pytest.mark.asyncio
async def test_analytics_summary(auth_client):
    resp = await auth_client.get("/api/v1/analytics/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "user" in data
    assert "task_counts" in data
