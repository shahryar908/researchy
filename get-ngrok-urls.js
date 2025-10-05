const axios = require('axios');

async function getNgrokUrls() {
  try {
    const { data } = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = data.tunnels;

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║         🌐 Ngrok Public URLs - Researchy Full Stack             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const frontend = tunnels.find(t => t.name === 'frontend');
    const backend = tunnels.find(t => t.name === 'backend');
    const agent = tunnels.find(t => t.name === 'agent');

    if (frontend) {
      console.log(`🎨 Frontend (Next.js):`);
      console.log(`   ${frontend.public_url}`);
      console.log(`   👆 Share this URL - this is your public app!`);
      console.log('');
    }

    if (backend) {
      console.log(`📦 Backend (Bun):`);
      console.log(`   ${backend.public_url}`);
      console.log('');
    }

    if (agent) {
      console.log(`🤖 Agent (Python):`);
      console.log(`   ${agent.public_url}`);
      console.log('');
    }

    console.log('─'.repeat(70));
    console.log('\n📝 Environment Variables to Update:\n');

    // Frontend .env.local
    console.log('1️⃣  frontend/.env.local:');
    console.log('   ──────────────────────────────────────────────────────────');
    if (backend) {
      console.log(`   NEXT_PUBLIC_API_URL=${backend.public_url}`);
    }
    console.log('');

    // Agent .env file
    console.log('2️⃣  agent/ai-researcher/.env:');
    console.log('   ──────────────────────────────────────────────────────────');
    if (backend) {
      console.log(`   BACKEND_URL=${backend.public_url}`);
    }
    console.log('');

    console.log('─'.repeat(70));
    console.log('\n✅ Quick Setup Steps:\n');
    console.log('   1. Update frontend/.env.local with backend URL above');
    console.log('   2. Update agent/ai-researcher/.env with backend URL');
    console.log('   3. Restart frontend window:');
    console.log('      - Press Ctrl+C in Frontend window');
    console.log('      - Run: cd frontend && npm run dev');
    console.log('   4. Restart agent window:');
    console.log('      - Press Ctrl+C in Agent window');
    console.log('      - Run: cd agent\\ai-researcher && uv run main.py');
    console.log('');

    if (frontend) {
      console.log('🚀 Your App is Live!');
      console.log(`   Visit: ${frontend.public_url}`);
      console.log('   Share this URL to showcase your AI Research Assistant!');
    }
    console.log('');
    console.log('📊 Monitor all requests: http://localhost:4040\n');

    // Copy to clipboard helper (Windows)
    if (frontend) {
      console.log('💡 Quick Copy Commands (Windows):');
      console.log(`   Frontend: echo ${frontend.public_url} | clip`);
      if (backend) {
        console.log(`   Backend:  echo ${backend.public_url} | clip`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error: Ngrok not running or API unavailable\n');
    console.log('📋 Make sure you:');
    console.log('   1. Started ngrok: start-ngrok.bat');
    console.log('   2. Wait ~15-20 seconds for initialization');
    console.log('   3. Ngrok dashboard is at: http://localhost:4040');
    console.log('');
  }
}

// Run the function
getNgrokUrls();
