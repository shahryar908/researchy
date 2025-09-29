// server.ts - Fixed with proper types
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { PrismaClient, Prisma } from './generated/prisma';
import axios, { AxiosResponse } from 'axios';

const app = express();
const prisma = new PrismaClient();

const FASTAPI_URL = 'http://localhost:8000';

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// ==================== TYPES ====================

interface AuthRequest extends Request {
    userId: string;
}

// FastAPI response types
interface FastAPIChatResponse {
    response: string;
    tool_calls: Array<{
        name: string;
        args: Record<string, any>;
        id: string;
    }> | null;
    user_id: string;
}

interface ConversationWithMessages {
    id: string;
    userId: string;
    threadId: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
        id: string;
        conversationId: string;
        userId: string;
        role: string;
        content: string;
        toolCalls: Prisma.JsonValue | null;
        metadata: Prisma.JsonValue | null;
        timestamp: Date;
    }>;
    _count: {
        messages: number;
    };
}

// ==================== MIDDLEWARE ====================

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    
    if (!auth.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    (req as AuthRequest).userId = auth.userId;
    
    // Ensure user exists in database
    try {
        await prisma.user.upsert({
            where: { clerkUserId: auth.userId },
            update: { updatedAt: new Date() },
            create: {
                clerkUserId: auth.userId,
            }
        });
    } catch (error) {
        console.error('Error upserting user:', error);
    }
    
    next();
};

// ==================== HELPER FUNCTIONS ====================

async function getOrCreateConversation(clerkUserId: string) {
    // Get user from database
    const user = await prisma.user.findUnique({
        where: { clerkUserId }
    });
    
    if (!user) {
        throw new Error('User not found');
    }
    
    // Get or create active conversation
    let conversation = await prisma.conversation.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
    });
    
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                userId: user.id,
                threadId: `thread_${user.id}_${Date.now()}`,
                title: 'New Research Session'
            }
        });
    }
    
    return { user, conversation };
}

async function saveMessage(
    conversationId: string,
    userId: string,
    role: string,
    content: string,
    toolCalls?: any
) {
    return await prisma.message.create({
        data: {
            conversationId,
            userId,
            role,
            content,
            toolCalls: toolCalls ? (toolCalls as Prisma.JsonValue) : null
        }
    });
}

// ==================== API ROUTES ====================

// Test route
app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Express + Prisma + FastAPI Research Agent" });
});

// Protected test route
app.get("/protected", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        
        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
            include: {
                conversations: {
                    take: 5,
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });
        
        res.json({
            message: "Protected route",
            user,
            conversationCount: user?.conversations.length || 0
        });
    } catch (error) {
        console.error('Error in protected route:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ==================== INTERNAL API ROUTES ====================

// Internal endpoint for FastAPI to get conversation history (no auth required)
app.get("/internal/conversation/:conversationId/history", async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        
        // Verify this is an internal request
        const internalHeader = req.headers['x-internal-request'];
        if (internalHeader !== 'true') {
            return res.status(403).json({ error: "Internal use only" });
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: { timestamp: 'asc' }
        });

        res.json({
            messages,
            count: messages.length
        });

    } catch (error: any) {
        console.error('Error fetching internal conversation history:', error);
        res.status(500).json({ error: "Failed to fetch conversation history" });
    }
});

// ==================== RESEARCH AGENT ROUTES ====================

// Chat with research agent
app.post("/api/research/chat", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: "Message is required and must be a string" });
        }

        // Get or create conversation
        const { user, conversation } = await getOrCreateConversation(userId);

        // Save user message to database
        await saveMessage(conversation.id, user.id, "user", message);

        // Call FastAPI with conversation context
        const response: AxiosResponse<FastAPIChatResponse> = await axios.post(
            `${FASTAPI_URL}/api/chat`,
            {
                user_id: userId,
                conversation_id: conversation.id,
                message: message
            }
        );

        // Save assistant response to database
        await saveMessage(
            conversation.id,
            user.id,
            "assistant",
            response.data.response,
            response.data.tool_calls
        );

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        res.json({
            ...response.data,
            conversationId: conversation.id
        });

    } catch (error: any) {
        console.error('Error in chat:', error);
        res.status(500).json({ 
            error: "Failed to process chat request",
            detail: error.response?.data || error.message 
        });
    }
});

// Stream chat responses
app.post("/api/research/chat/stream", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: "Message is required" });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Call FastAPI streaming endpoint
        const response = await axios.post(
            `${FASTAPI_URL}/api/chat/stream`,
            { user_id: userId, message },
            { responseType: 'stream' }
        );

        // Pipe the stream to client
        response.data.pipe(res);
    } catch (error: any) {
        console.error('Error streaming from FastAPI:', error);
        res.status(500).json({ error: "Failed to stream response" });
    }
});

// Get conversation history from database
app.get("/api/research/history", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { conversationId } = req.query;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let messages;

        if (conversationId && typeof conversationId === 'string') {
            // Get specific conversation
            messages = await prisma.message.findMany({
                where: {
                    conversationId: conversationId,
                    userId: user.id
                },
                orderBy: { timestamp: 'asc' }
            });
        } else {
            // Get latest conversation
            const conversation = await prisma.conversation.findFirst({
                where: { userId: user.id },
                orderBy: { updatedAt: 'desc' },
                include: {
                    messages: {
                        orderBy: { timestamp: 'asc' }
                    }
                }
            });

            messages = conversation?.messages || [];
        }

        res.json({
            messages,
            count: messages.length
        });

    } catch (error: any) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: "Failed to fetch conversation history" });
    }
});

// Get all conversations for a user
app.get("/api/research/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const conversations = await prisma.conversation.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                },
                _count: {
                    select: { messages: true }
                }
            }
        });

        res.json({
            conversations: conversations.map((conv: ConversationWithMessages) => ({
                id: conv.id,
                threadId: conv.threadId,
                title: conv.title,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                messageCount: conv._count.messages,
                lastMessage: conv.messages[0]?.content.substring(0, 100) || null
            }))
        });

    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Create new conversation
app.post("/api/research/conversations/new", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { title } = req.body;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const conversation = await prisma.conversation.create({
            data: {
                userId: user.id,
                threadId: `thread_${user.id}_${Date.now()}`,
                title: title || 'New Research Session'
            }
        });

        res.json({ conversation });

    } catch (error: any) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

// Delete conversation
app.delete("/api/research/conversations/:conversationId", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { conversationId } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: user.id
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Delete conversation (messages will be cascade deleted)
        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        res.json({ message: "Conversation deleted successfully" });

    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: "Failed to delete conversation" });
    }
});

// Download generated paper
app.get("/api/research/papers/:filename", requireAuth, async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        const response = await axios.get(
            `${FASTAPI_URL}/api/papers/download/${filename}`,
            { responseType: 'stream' }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        response.data.pipe(res);
    } catch (error: any) {
        console.error('Error downloading paper:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: "Paper not found" });
        }
        
        res.status(500).json({ error: "Failed to download paper" });
    }
});

// List all papers
app.get("/api/research/papers", requireAuth, async (req: Request, res: Response) => {
    try {
        const response: AxiosResponse<{ papers: any[]; count: number }> = await axios.get(
            `${FASTAPI_URL}/api/papers/list`
        );
        
        res.json(response.data);
    } catch (error: any) {
        console.error('Error listing papers:', error);
        res.status(500).json({ error: "Failed to list papers" });
    }
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connection...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing database connection...');
    await prisma.$disconnect();
    process.exit(0);
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`✅ Express server running on http://localhost:${PORT}`);
    console.log(`📊 Database: Connected`);
    console.log(`🔗 FastAPI: ${FASTAPI_URL}`);
});