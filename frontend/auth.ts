import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { DynamoDB, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"
import { DynamoDBAdapter } from "@auth/dynamodb-adapter"
 
// Check if DynamoDB credentials are configured
const hasDynamoDBConfig = !!(
  process.env.AUTH_DYNAMODB_ID &&
  process.env.AUTH_DYNAMODB_SECRET &&
  process.env.AUTH_DYNAMODB_REGION
);

// AWS DynamoDB configuration for next-auth (optional)
let adapter = undefined;

if (hasDynamoDBConfig) {
  const config: DynamoDBClientConfig = {
    credentials: {
      accessKeyId: process.env.AUTH_DYNAMODB_ID!,
      secretAccessKey: process.env.AUTH_DYNAMODB_SECRET!,
    },
    region: process.env.AUTH_DYNAMODB_REGION!,
  }
  
  const client = DynamoDBDocument.from(new DynamoDB(config), {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });
  
  adapter = DynamoDBAdapter(client, { tableName: "users" });
  console.log("DynamoDB adapter enabled - users will be persisted to database");
} else {
  console.log("DynamoDB adapter disabled - using JWT-only sessions (no persistence)");
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  adapter: adapter,
  session: {
    strategy: hasDynamoDBConfig ? "database" : "jwt",
  },
  
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      // Be defensive: token may be undefined in some flows (middleware/session retrieval),
      // so guard property access to avoid runtime TypeErrors which surface as SessionTokenError.
      try {
        if (token) {
          // JWT session mode (no database) - data comes from token
          (session as any).accessToken = (token as any).accessToken ?? null;
          (session as any).provider = (token as any).provider ?? null;
          (session as any).userId = (token as any).id ?? null;
          
          // In JWT mode, also attach user.id for consistency
          if (session.user && (token as any).id) {
            session.user.id = (token as any).id;
          }
        } else if (user) {
          // Database session mode (with adapter) - data comes from user record
          (session as any).provider = (user as any).provider ?? null;
          (session as any).userId = user.id ?? null;
          (session as any).accessToken = null;
          
          if (session.user) {
            session.user.id = user.id;
          }
        } else {
          (session as any).accessToken = null;
          (session as any).provider = null;
          (session as any).userId = null;
        }
      } catch (e) {
        // If anything goes wrong, ensure we return a valid session object and
        // surface the error for debugging rather than crashing middleware.
        console.error('session callback error', e);
        (session as any).accessToken = null;
        (session as any).provider = null;
        (session as any).userId = null;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful sign-in for debugging
      console.log('User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        name: user.name,
        persistedToDatabase: hasDynamoDBConfig
      });
      
      // Note: If DynamoDB adapter is enabled, it automatically handles user creation
      // If disabled, user data is only stored in JWT token (not persisted)
    },
    async createUser({ user }) {
      console.log('New user created:', {
        userId: user.id,
        email: user.email,
        name: user.name,
        location: hasDynamoDBConfig ? 'DynamoDB' : 'JWT token only (not persisted)'
      });
    }
  },
  pages: {
    signIn: '/',
    signOut: '/',
  },
  debug: process.env.NODE_ENV === 'development',
});