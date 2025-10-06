// server.ts - Fixed with proper types
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
// CLERK AUTH COMMENTED OUT - Uncomment when ready to use authentication
// import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { PrismaClient, Prisma } from './generated/prisma';
import axios, { AxiosResponse } from 'axios';
import { createClient } from '@supabase/supabase-js';

const app = express();
const prisma = new PrismaClient();

const FASTAPI_URL = 'http://localhost:8000';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SUCCESS] Supabase client initialized');
} else {
    console.log('[WARNING] Supabase not configured - PDFs will be served locally');
}

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://research-agent-git-main1-shahryar908s-projects.vercel.app',
        'https://researchy-kyon4uut9-shahryar908s-projects.vercel.app',
        /\.vercel\.app$/,  // Allow all Vercel preview deployments
        /\.ngrok\.io$/,    // Allow ngrok tunnels
        /\.ngrok-free\.app$/,  // Allow ngrok free tier
        /^https?:\/\/[a-z0-9-]+\.ngrok-free\.app$/,  // Explicit ngrok pattern
        /^https?:\/\/[a-z0-9-]+\.ngrok\.io$/  // Explicit ngrok.io pattern
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// CLERK MIDDLEWARE COMMENTED OUT - Uncomment when ready to use authentication
// app.use(clerkMiddleware());

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

// AUTHENTICATION DISABLED - Using mock user for testing
// Uncomment the code below and comment out the mock version when ready to enable auth
/*
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
*/

// MOCK AUTH MIDDLEWARE - For testing without authentication
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    // Use a mock user ID for testing
    (req as AuthRequest).userId = 'test_user_123';

    // Ensure mock user exists in database
    try {
        await prisma.user.upsert({
            where: { clerkUserId: 'test_user_123' },
            update: { updatedAt: new Date() },
            create: {
                clerkUserId: 'test_user_123',
            }
        });
    } catch (error) {
        console.error('Error upserting mock user:', error);
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

async function generateConversationTitle(conversation: any, firstMessage: string, response: string) {
    try {
        console.log(`DEBUG: generateConversationTitle called for conversation ${conversation.id}`);
        console.log(`DEBUG: Current title: "${conversation.title}"`);
        console.log(`DEBUG: First message: "${firstMessage}"`);
        console.log(`DEBUG: Response length: ${response?.length || 0}`);

        // Only generate title for conversations that still have default title
        if (conversation.title !== 'New Research Session' && conversation.title !== null) {
            console.log('DEBUG: Conversation already has custom title, skipping');
            return; // Already has a custom title
        }

        // Check if this is actually the first exchange
        const messageCount = await prisma.message.count({
            where: { conversationId: conversation.id }
        });

        console.log(`DEBUG: Message count in conversation: ${messageCount}`);

        // Generate title for conversations with few messages (first few exchanges)
        if (messageCount <= 4) { // Allow title generation for first 2 exchanges
            console.log('Generating title for new conversation...');
            
            try {
                const titleResponse = await axios.post(`${FASTAPI_URL}/api/generate-title`, {
                    first_message: firstMessage,
                    response: response
                }, {
                    timeout: 10000 // 10 second timeout
                });

                const newTitle = titleResponse.data.title;
                console.log(`DEBUG: Received title from API: "${newTitle}"`);
                
                // Update conversation with generated title
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { title: newTitle }
                });

                console.log(`[OK] Generated title: "${newTitle}" for conversation ${conversation.id}`);
            } catch (apiError: any) {
                console.error('DEBUG: FastAPI title generation failed:', apiError.message);
                throw apiError; // This will trigger the fallback
            }
        } else {
            console.log('DEBUG: Skipping title generation - too many messages');
        }
    } catch (error) {
        console.error('Error generating conversation title:', error);
        // Fallback: use first few words of the message
        try {
            const fallbackTitle = firstMessage.split(' ').slice(0, 4).join(' ');
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { title: fallbackTitle || 'Research Conversation' }
            });
        } catch (fallbackError) {
            console.error('Error setting fallback title:', fallbackError);
        }
    }
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

        // Get user's name - CLERK AUTH DISABLED, using default name
        // Uncomment below when Clerk is enabled
        /*
        const auth = getAuth(req);
        const clerkUser = auth.sessionClaims;
        const userName = (clerkUser?.firstName as string) || (clerkUser?.email_addresses?.[0]?.email_address as string)?.split('@')[0] || "User";
        */
        const userName = "User"; // Default user name for testing
        console.log(`DEBUG: User name for PDF: ${userName}`);

        // Call FastAPI with conversation context
        const response: AxiosResponse<FastAPIChatResponse> = await axios.post(
            `${FASTAPI_URL}/api/chat`,
            {
                user_id: userId,
                conversation_id: conversation.id,
                message: message,
                user_name: userName
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

        // Generate title for new conversations AFTER saving message
        console.log('DEBUG: About to call generateConversationTitle (non-streaming)');
        generateConversationTitle(conversation, message, response.data.response);

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
        const { message, conversationId } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: "Message is required" });
        }

        // Get or create conversation
        const { user, conversation } = await getOrCreateConversation(userId);

        // Save user message to database first
        await saveMessage(conversation.id, user.id, "user", message);

        // Set proper SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // Send initial connection event
        res.write(': Connected to chat stream\n\n');

        // Get user's name - CLERK AUTH DISABLED, using default name
        // Uncomment below when Clerk is enabled
        /*
        const auth = getAuth(req);
        const clerkUser = auth.sessionClaims;
        const userName = (clerkUser?.firstName as string) || (clerkUser?.email_addresses?.[0]?.email_address as string)?.split('@')[0] || "User";
        */
        const userName = "User"; // Default user name for testing
        console.log(`DEBUG: User name for PDF (streaming): ${userName}`);

        // Call FastAPI streaming endpoint
        const response = await axios.post(
            `${FASTAPI_URL}/api/chat/stream`,
            {
                user_id: userId,
                conversation_id: conversationId || conversation.id,
                message,
                user_name: userName
            },
            { responseType: 'stream' }
        );

        let assistantMessage = "";
        let toolCallsData = null;
        let streamBuffer = ""; // Buffer to accumulate partial SSE data

        // Process streaming data and save final response
        response.data.on('data', (chunk: Buffer) => {
            const data = chunk.toString();
            res.write(data);

            // Add to buffer and process complete lines
            streamBuffer += data;
            const lines = streamBuffer.split('\n');
            
            // Keep the last potentially incomplete line in buffer
            streamBuffer = lines.pop() || "";

            // Parse complete SSE lines
            for (const line of lines) {
                if (line.startsWith('data: ') && line.trim() !== 'data:') {
                    try {
                        const jsonStr = line.substring(6).trim();
                        if (jsonStr) {
                            const jsonData = JSON.parse(jsonStr);
                            
                            if (jsonData.type === 'content') {
                                assistantMessage += jsonData.content;
                            } else if (jsonData.type === 'tool_calls') {
                                toolCallsData = jsonData.tool_calls;
                            } else if (jsonData.type === 'complete') {
                                // Save complete assistant response to database
                                saveMessage(
                                    conversation.id,
                                    user.id,
                                    "assistant",
                                    jsonData.response,
                                    toolCallsData
                                ).then(() => {
                                    // Generate title for new conversations AFTER saving message
                                    generateConversationTitle(conversation, message, jsonData.response);
                                }).catch(err => console.error('Error saving message:', err));

                                // Update conversation timestamp
                                prisma.conversation.update({
                                    where: { id: conversation.id },
                                    data: { updatedAt: new Date() }
                                }).catch(err => console.error('Error updating conversation:', err));
                            }
                        }
                    } catch (parseError) {
                        // Ignore parse errors for partial data
                    }
                }
            }
        });

        response.data.on('end', () => {
            res.end();
        });

        response.data.on('error', (error: any) => {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ type: "error", error: "Stream failed" })}\n\n`);
            res.end();
        });

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

// GET /api/research/papers/library - Get user's paper library (MUST be before :filename route)
app.get("/api/research/papers/library", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.json({ papers: [] });
        }

        const papers = await prisma.paper.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[OK] Retrieved ${papers.length} papers for user ${userId}`);
        res.json({ papers });

    } catch (error: any) {
        console.error('Error fetching paper library:', error);
        res.status(500).json({ error: "Failed to fetch paper library" });
    }
});

// Download generated paper
app.get("/api/research/papers/:filename", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { filename } = req.params;

        // Try Supabase first if configured
        if (supabase) {
            try {
                console.log(`[SUPABASE] Attempting download: ${userId}/${filename}`);

                const { data: fileData, error } = await supabase.storage
                    .from('researchy')
                    .download(`${userId}/${filename}`);

                if (error) {
                    console.log(`[SUPABASE] Download error:`, {
                        message: error.message,
                        statusCode: error.statusCode,
                        error: error.error,
                        name: error.name
                    });
                    // File not found in Supabase, fall through to local
                } else if (fileData) {
                    console.log(`[SUPABASE] ✓ Successfully downloaded: ${filename}`);

                    // Convert blob to buffer
                    const buffer = Buffer.from(await fileData.arrayBuffer());

                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    res.setHeader('Content-Length', buffer.length.toString());

                    return res.send(buffer);
                }
            } catch (supabaseError: any) {
                console.log(`[SUPABASE] Exception:`, supabaseError.message || supabaseError);
            }
        }

        // Fallback to FastAPI/local storage
        console.log(`Downloading from FastAPI: ${filename}`);
        const response = await axios.get(
            `${FASTAPI_URL}/api/papers/download/${filename}`,
            {
                responseType: 'stream',
                params: { user_id: userId }
            }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        response.data.pipe(res);
        
    } catch (error: any) {
        console.error('Error downloading paper:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ 
                error: "Paper not found",
                detail: "The requested PDF file could not be found in storage"
            });
        }
        
        res.status(500).json({ 
            error: "Failed to download paper",
            detail: error.message
        });
    }
});

// List all papers
app.get("/api/research/papers", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        let allPapers: any[] = [];

        // Try to get papers from Supabase first
        if (supabase) {
            try {
                const { data: supabaseFiles, error } = await supabase.storage
                    .from('researchy')
                    .list(`${userId}/`, {
                        limit: 100,
                        sortBy: { column: 'created_at', order: 'desc' }
                    });

                if (!error && supabaseFiles) {
                    const pdfFiles = supabaseFiles.filter((file: any) => 
                        file.name && file.name.toLowerCase().endsWith('.pdf')
                    );
                    
                    allPapers = pdfFiles.map((file: any) => ({
                        filename: file.name,
                        path: `supabase:${userId}/${file.name}`,
                        size: file.metadata?.size || 0,
                        created: file.created_at,
                        source: 'supabase'
                    }));
                    
                    console.log(`Found ${allPapers.length} papers in Supabase for user ${userId}`);
                }
            } catch (supabaseError: any) {
                console.log(`Error listing Supabase papers: ${supabaseError.message}`);
            }
        }

        // Also get papers from FastAPI/local storage as fallback
        try {
            const response: AxiosResponse<{ papers: any[]; count: number }> = await axios.get(
                `${FASTAPI_URL}/api/papers/list`
            );
            
            if (response.data.papers) {
                const localPapers = response.data.papers.map((paper: any) => ({
                    ...paper,
                    source: 'local'
                }));
                allPapers = [...allPapers, ...localPapers];
            }
        } catch (fastApiError: any) {
            console.log(`Error listing local papers: ${fastApiError.message}`);
        }

        // Remove duplicates based on filename
        const uniquePapers = allPapers.reduce((acc: any[], paper: any) => {
            const exists = acc.find(p => p.filename === paper.filename);
            if (!exists) {
                acc.push(paper);
            }
            return acc;
        }, []);

        res.json({
            papers: uniquePapers,
            count: uniquePapers.length,
            sources: {
                supabase: allPapers.filter(p => p.source === 'supabase').length,
                local: allPapers.filter(p => p.source === 'local').length
            }
        });
        
    } catch (error: any) {
        console.error('Error listing papers:', error);
        res.status(500).json({ error: "Failed to list papers" });
    }
});

// POST /api/research/papers/metadata - Save paper metadata (internal endpoint from FastAPI)
app.post("/api/research/papers/metadata", async (req: Request, res: Response) => {
    try {
        // Verify internal request
        const internalHeader = req.headers['x-internal-request'];
        if (internalHeader !== 'true') {
            return res.status(403).json({ error: "Forbidden: Internal endpoint only" });
        }

        const { user_id, filename, title, supabase_path, file_size } = req.body;

        if (!user_id || !filename || !title) {
            return res.status(400).json({ error: "Missing required fields: user_id, filename, title" });
        }

        // Find user by Clerk ID
        const user = await prisma.user.findUnique({
            where: { clerkUserId: user_id }
        });

        if (!user) {
            // Create user if doesn't exist
            const newUser = await prisma.user.create({
                data: {
                    clerkUserId: user_id
                }
            });

            // Create paper record
            const paper = await prisma.paper.create({
                data: {
                    userId: newUser.id,
                    filename,
                    title,
                    supabasePath: supabase_path || null,
                    fileSize: file_size || null
                }
            });

            console.log(`[OK] Created paper metadata for new user ${user_id}: ${title}`);
            return res.json({ success: true, paper });
        }

        // Create paper record for existing user
        const paper = await prisma.paper.create({
            data: {
                userId: user.id,
                filename,
                title,
                supabasePath: supabase_path || null,
                fileSize: file_size || null
            }
        });

        console.log(`[OK] Created paper metadata for user ${user_id}: ${title}`);
        res.json({ success: true, paper });

    } catch (error: any) {
        console.error('Error saving paper metadata:', error);
        res.status(500).json({ error: "Failed to save paper metadata" });
    }
});

// DELETE /api/research/papers/:id - Delete paper from library
app.delete("/api/research/papers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const { userId } = req as AuthRequest;
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify paper belongs to user before deleting
        const paper = await prisma.paper.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!paper) {
            return res.status(404).json({ error: "Paper not found or unauthorized" });
        }

        // Delete from database
        await prisma.paper.delete({
            where: { id }
        });

        // TODO: Also delete from Supabase storage if needed

        console.log(`[OK] Deleted paper ${id} for user ${userId}`);
        res.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting paper:', error);
        res.status(500).json({ error: "Failed to delete paper" });
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

const server = app.listen(PORT, () => {
    console.log(`[OK] Express server running on http://localhost:${PORT}`);
    console.log(`[DB] Database: Connected`);
    console.log(`[API] FastAPI: ${FASTAPI_URL}`);
});

// Keep the process alive
process.stdin.resume();