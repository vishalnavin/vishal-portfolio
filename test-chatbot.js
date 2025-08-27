const testQuestions = [
  "What did Vishal do at Rockstar?",
  "Which ML techniques did he use at Coalition Greenwich?",
  "Why should we hire you?",
  "Tell me about your achievements at Rockstar Games",
  "What tools do you use?",
  "How can I contact you?",
  "Walk me through your career timeline.",
  "What industries have you worked in?"
];

const expectedSnippets = [
  ["pyspark", "telemetry", "retention"],
  ["gradient boosting", "random forest"],
  ["pyspark", "sql", "tableau"],
  ["rockstar", "clustering", "pipeline"],
  ["tableau"],
  ["email", "linkedin"],
  ["rockstar 2025", "coalition 2024", "pricerite 2022", "msc", "bsc"],
  ["gaming", "finance", "retail", "academia"]
];

async function testChatbot() {
  console.log("🧪 Starting RAG Chatbot Test Suite\n");
  
  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    const expected = expectedSnippets[i];
    
    console.log(`\n${i + 1}. Question: "${question}"`);
    console.log(`   Expected: ${expected.join(', ')}`);
    
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (data.answer) {
        console.log(`   ✅ Answer: ${data.answer.substring(0, 100)}...`);
        
        // Check if expected content is mentioned
        const answerLower = data.answer.toLowerCase();
        const foundKeywords = [];
        const missingKeywords = [];
        
        expected.forEach(keyword => {
          if (answerLower.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
          } else {
            missingKeywords.push(keyword);
          }
        });
        
        if (foundKeywords.length > 0) {
          console.log(`   ✅ PASS: Found ${foundKeywords.join(', ')}`);
          if (missingKeywords.length > 0) {
            console.log(`   ⚠️  Missing: ${missingKeywords.join(', ')}`);
          }
        } else {
          console.log(`   ❌ FAIL: Missing all expected content`);
        }
      } else {
        console.log(`   ❌ No answer received`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n🏁 Test suite complete!");
}

testChatbot().catch(console.error);
