# Database Setup Guide

## Prerequisites
- PostgreSQL 15+ installed and running

## Quick Setup

### Option 1: Using Railway.app (Recommended for Cloud)
1. Go to https://railway.app
2. Create new PostgreSQL database
3. Copy connection string
4. Set in backend `.env` as `DATABASE_URL`

### Option 2: Local PostgreSQL

#### On macOS
```bash
brew install postgresql
brew services start postgresql
```

#### On Ubuntu/Debian
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### On Windows
Download and install from https://www.postgresql.org/download/windows/

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE atomquest;

# Exit psql
\q

# Run schema file
psql -U postgres -d atomquest -f schema.sql
```

### Verify Setup

```bash
psql -U postgres -d atomquest -c "SELECT COUNT(*) FROM employees;"
```

Expected output:
```
 count
-------
     3
(1 row)
```

## Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:admin@localhost:5432/atomquest
```

## Tables

1. **employees** - User accounts with roles
2. **goals** - Employee goals
3. **quarterly_achievements** - Actual achievement data
4. **check_ins** - Manager feedback
5. **audit_logs** - Change tracking

## Test Data

3 test users are automatically created:
- alice@acme.com (Employee)
- bob@acme.com (Manager)
- charlie@acme.com (Admin)

4 sample goals are created for Alice.
