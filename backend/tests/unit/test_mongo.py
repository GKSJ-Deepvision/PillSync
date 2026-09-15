"""
Unit tests for MongoDB Helper Module and MongoStoreView
"""

from unittest.mock import MagicMock, patch

import pytest

from config.mongo import delete_document, get_document, list_documents, store_document


@pytest.mark.unit
def test_mongo_helpers_with_mock():
    mock_inserted = MagicMock()
    mock_inserted.inserted_id = "mocked_id_12345"

    mock_collection = MagicMock()
    mock_collection.insert_one.return_value = mock_inserted
    mock_collection.find_one.return_value = {"_id": "mocked_id_12345", "user_id": 1, "key": "value"}
    mock_collection.find.return_value.limit.return_value = [
        {"_id": "mocked_id_12345", "user_id": 1, "key": "value"}
    ]
    mock_collection.delete_many.return_value.deleted_count = 1

    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_collection

    with patch("config.mongo.get_mongo_db", return_value=mock_db):
        # 1. Test Store Document
        inserted_id = store_document("test_col", {"user_id": 1, "key": "value"})
        assert inserted_id == "mocked_id_12345"
        mock_collection.insert_one.assert_called_once()

        # 2. Test Get Document
        doc = get_document("test_col", {"user_id": 1})
        assert doc == {"_id": "mocked_id_12345", "user_id": 1, "key": "value"}

        # 3. Test List Documents
        docs = list_documents("test_col", {"user_id": 1})
        assert len(docs) == 1
        assert docs[0]["key"] == "value"

        # 4. Test Delete Document
        count = delete_document("test_col", {"user_id": 1})
        assert count == 1
