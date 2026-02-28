import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Check if DynamoDB is configured
const hasDynamoDBConfig = !!(
  process.env.AUTH_DYNAMODB_ID &&
  process.env.AUTH_DYNAMODB_SECRET &&
  process.env.AUTH_DYNAMODB_REGION
);

let docClient: DynamoDBDocumentClient | null = null;

if (hasDynamoDBConfig) {
  const client = new DynamoDBClient({
    region: process.env.AUTH_DYNAMODB_REGION,
    credentials: {
      accessKeyId: process.env.AUTH_DYNAMODB_ID!,
      secretAccessKey: process.env.AUTH_DYNAMODB_SECRET!,
    },
  });
  docClient = DynamoDBDocumentClient.from(client);
}

export async function GET(req: Request) {
  // Return mock data if DynamoDB is not configured
  if (!hasDynamoDBConfig || !docClient) {
    return Response.json({
      success: true,
      data: {
        sport: "Football",
        team: "Kansas City Chiefs",
        player: "Patrick Mahomes",
        totalBets: 0,
        usingMockData: true
      }
    });
  }

  try {
    // Scan the PreviousBets table to get all bets
    const result = await docClient.send(new ScanCommand({
      TableName: "PreviousBets",
      // Only get the fields we need for aggregation
      ProjectionExpression: "sport, team, player",
    }));

    const bets = result.Items || [];

    // If no bets exist, return mock data
    if (bets.length === 0) {
      return Response.json({
        success: true,
        data: {
          sport: "Football",
          team: "Kansas City Chiefs",
          player: "Patrick Mahomes",
          totalBets: 0,
          usingMockData: true
        }
      });
    }

    // Count occurrences
    const sportCounts: Record<string, number> = {};
    const teamCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {};

    bets.forEach((bet) => {
      // Count sports
      if (bet.sport) {
        sportCounts[bet.sport] = (sportCounts[bet.sport] || 0) + 1;
      }
      
      // Count teams
      if (bet.team) {
        teamCounts[bet.team] = (teamCounts[bet.team] || 0) + 1;
      }
      
      // Count players
      if (bet.player) {
        playerCounts[bet.player] = (playerCounts[bet.player] || 0) + 1;
      }
    });

    // Find most popular of each
    const mostPopularSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Football";
    const mostPopularTeam = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Kansas City Chiefs";
    const mostPopularPlayer = Object.entries(playerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Patrick Mahomes";

    return Response.json({
      success: true,
      data: {
        sport: mostPopularSport,
        team: mostPopularTeam,
        player: mostPopularPlayer,
        totalBets: bets.length,
        usingMockData: false,
        counts: {
          sports: sportCounts,
          teams: teamCounts,
          players: playerCounts
        }
      }
    });

  } catch (error) {
    console.error("Error fetching popular bets:", error);
    
    // Return mock data on error
    return Response.json({
      success: true,
      data: {
        sport: "Football",
        team: "Kansas City Chiefs",
        player: "Patrick Mahomes",
        totalBets: 0,
        usingMockData: true,
        error: "Failed to fetch from database"
      }
    });
  }
}
