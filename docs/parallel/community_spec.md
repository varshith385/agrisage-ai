# Community Module — Technical Specification

**AgriSage AI | Tier 2 Module Specification**

## 1. Domain Entities & Database Models

### 1.1 `FarmerGroup` & `GroupMember` (`community.py`)
- `farmer_groups`:
  - `id`: Integer Primary Key
  - `name`: String(120), unique index
  - `description`: Text
  - `village`: String(80), indexed
  - `mandal`: String(80), indexed
  - `district`: String(80), indexed
  - `state`: String(80)
  - `crop_focus`: String(100) (e.g., "Cotton", "Chilli")
  - `created_by_user_id`: Foreign Key to `users.id`
  - `created_at`: DateTime (UTC)
- `group_members`:
  - `id`: Integer Primary Key
  - `group_id`: Foreign Key to `farmer_groups.id`
  - `user_id`: Foreign Key to `users.id`
  - `consent_share_contact`: Boolean (default `False`)
  - `consent_timestamp`: DateTime (UTC), nullable
  - `joined_at`: DateTime (UTC)

### 1.2 `CommunityRequest` & `RequestParticipant` (`community.py`)
- `community_requests`:
  - `request_type`: Enum (`transport`, `input_purchase`, `pooled_sale`)
  - `status`: Enum (`open`, `full`, `in_progress`, `completed`, `cancelled`)
  - `title`, `description`, `village`, `district`, `state`
  - Transport fields: `destination`, `total_capacity_quintals`, `base_truck_cost`, `rate_per_km`, `distance_km`
  - Input purchase fields: `item_name`, `target_quantity`, `bulk_price_per_unit`, `retail_price_per_unit`
  - Pooled sale fields: `crop_name`, `target_quantity_quintals`, `expected_price_per_quintal`

### 1.3 `MachineryListing` & `MachineryBooking` (`machinery.py`)
- `machinery_listings`:
  - `owner_id`: Foreign Key to `users.id`
  - `machinery_name`: String(120)
  - `category`: Enum (`tractor`, `rotavator`, `sprayer`, `harvester`, `seed_drill`, `other`)
  - `hourly_rate`: Float, nullable
  - `daily_rate`: Float, nullable
  - `village`, `district`, `state`, `latitude`, `longitude`
  - `is_available`: Boolean
- `machinery_bookings`:
  - `listing_id`, `renter_id`, `start_date`, `end_date`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`), `estimated_total`, `booking_note`

## 2. API Endpoints

- `GET /api/v1/community/groups`: List farmer groups with membership counts and caller joined status.
- `POST /api/v1/community/groups`: Create a new farmer group.
- `POST /api/v1/community/groups/{id}/join`: Join a group.
- `POST /api/v1/community/groups/{id}/leave`: Leave a group.
- `POST /api/v1/community/groups/{id}/consent`: Explicitly grant or revoke contact sharing consent.
- `GET /api/v1/community/groups/{id}/members`: List group members (scrubbed unless mutual consent is granted).
- `GET /api/v1/community/nearby-farmers`: List nearby farmers at village centroid level.
- `GET /api/v1/community/requests`: List pooled transport and bulk input purchase requests.
- `POST /api/v1/community/requests`: Create a new pooled request.
- `POST /api/v1/community/requests/{id}/join`: Join an existing pooled request.
- `POST /api/v1/community/calculate-split`: Standalone cost-splitting calculator.
- `GET /api/v1/machinery/guide`: Rule-based crop-stage mechanization package.
- `GET /api/v1/machinery/listings`: Haversine distance-ranked machinery listings.
- `POST /api/v1/machinery/listings`: Register a machinery asset.
- `POST /api/v1/machinery/bookings`: Request an offline rental booking.
- `GET /api/v1/outbreaks/clusters`: Village-aggregated disease clusters (minimum 3 reports required).
- `GET /api/v1/outbreaks/district-summary`: Officer epidemiological dashboard (Expert/Admin only).
