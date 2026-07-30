import io


def upload_csv(client, headers, csv_content: str, name: str = "test dataset"):
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"name": name}
    resp = client.post("/dataset", headers=headers, data=data, files=files)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_compute_sum_valid_column(client, auth_headers):
    csv_content = "score\n10\n20\n30\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "score", "operation": "sum"},
    )
    assert resp.status_code == 200
    assert resp.json()["result"] == 60


def test_compute_min_max_valid_column(client, auth_headers):
    csv_content = "score\n10\n20\n30\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp_min = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "score", "operation": "min"},
    )
    assert resp_min.json()["result"] == 10

    resp_max = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "score", "operation": "max"},
    )
    assert resp_max.json()["result"] == 30


def test_compute_column_not_found(client, auth_headers):
    csv_content = "score\n10\n20\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "doesnotexist", "operation": "sum"},
    )
    assert resp.status_code == 400
    assert "not found" in resp.json()["detail"]


def test_compute_empty_dataset(client, auth_headers):
    # header only, zero data rows
    csv_content = "score\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "score", "operation": "sum"},
    )
    assert resp.status_code == 400
    assert "no rows" in resp.json()["detail"]


def test_compute_all_nulls_column(client, auth_headers):
    csv_content = "score,other\n,1\n,2\n,3\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "score", "operation": "sum"},
    )
    assert resp.status_code == 400
    assert "no non-null values" in resp.json()["detail"]


def test_compute_non_numeric_column(client, auth_headers):
    csv_content = "city\nNew York\nChicago\n"
    dataset_id = upload_csv(client, auth_headers, csv_content)

    resp = client.post(
        f"/dataset/{dataset_id}/compute",
        headers=auth_headers,
        json={"column": "city", "operation": "sum"},
    )
    assert resp.status_code == 400
    assert "not numeric" in resp.json()["detail"]


def test_compute_unauthenticated(client):
    resp = client.post(
        "/dataset/1/compute",
        json={"column": "score", "operation": "sum"},
    )
    assert resp.status_code in (401, 403)