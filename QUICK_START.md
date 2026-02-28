# Quick Start Guide

## Running Locally (Minimal Setup)

The app can run **without DynamoDB** for quick local development:

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Minimum Environment Variables

Create `frontend/.env.local` with:

```bash
# NextAuth
AUTH_SECRET="your-random-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (get from: https://github.com/settings/developers)
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# Google OAuth (get from: https://console.cloud.google.com)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# DynamoDB (OPTIONAL - leave empty for JWT-only auth)
AUTH_DYNAMODB_ID=""
AUTH_DYNAMODB_SECRET=""
AUTH_DYNAMODB_REGION=""
```

### 3. Run Development Server

```bash
npm run dev
```

**Note:** Without DynamoDB:

- ✅ Authentication works (GitHub/Google sign-in)
- ✅ Sessions are stored in encrypted JWT cookies
- ❌ Users are NOT persisted (lost on sign-out)
- ❌ Betting history won't be saved

---

## Full Setup (With DynamoDB)

For production or to persist data, configure DynamoDB:

### 1. Create AWS DynamoDB Tables

#### Table 1: `users` (for authentication)

```bash
aws dynamodb create-table \
  --table-name users \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"GSI1\",\"KeySchema\":[{\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"GSI2\",\"KeySchema\":[{\"AttributeName\":\"GSI2PK\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"GSI2SK\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

#### Table 2: `PreviousBets` (for betting history)

```bash
aws dynamodb create-table \
  --table-name PreviousBets \
  --attribute-definitions \
    AttributeName=UserId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=UserId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

### 2. Add DynamoDB Credentials to `.env.local`

```bash
AUTH_DYNAMODB_ID="your-aws-access-key-id"
AUTH_DYNAMODB_SECRET="your-aws-secret-access-key"
AUTH_DYNAMODB_REGION="us-west-2"
```

### 3. Restart Development Server

The app will automatically detect DynamoDB credentials and enable database persistence.

---

## How It Works

The authentication system **automatically adapts**:

| DynamoDB Configured | Auth Works   | Users Persisted | Bets Saved |
| ------------------- | ------------ | --------------- | ---------- |
| ❌ No               | ✅ Yes (JWT) | ❌ No           | ❌ No      |
| ✅ Yes              | ✅ Yes (DB)  | ✅ Yes          | ✅ Yes     |

Check the console logs when starting the app:

- `✅ DynamoDB adapter enabled` - Full database mode
- `ℹ️ DynamoDB adapter disabled` - JWT-only mode

---

## OAuth Setup

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. Create a "New OAuth App"
3. Set **Homepage URL**: `http://localhost:3000`
4. Set **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Copy the Client ID and Client Secret to `.env.local`

### Google OAuth

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to `.env.local`

---

## Troubleshooting

**Authentication fails immediately:**

- Check AUTH_SECRET is set
- Verify OAuth credentials are correct
- Check redirect URIs match exactly

**"Session token error":**

- Clear browser cookies
- Restart dev server
- Check console for specific errors

**Bets not saving:**

- Verify DynamoDB credentials are set
- Check AWS IAM permissions include DynamoDB access
- Ensure `PreviousBets` table exists
