const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAIInsights = async (expenses, budgets) => {
  
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const categoryMap = {};
  expenses.forEach((e) => {
    const name = e.categories?.name || e.category_name || 'Other';
    categoryMap[name] = (categoryMap[name] || 0) + (e.amount || 0);
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `${name}: ₱${amount.toFixed(2)}`)
    .join('\n');

  const budgetInfo = budgets
    ? `Daily budget: ₱${budgets.daily || 0}, Weekly: ₱${budgets.weekly || 0}, Monthly: ₱${budgets.monthly || 0}`
    : 'No budgets set.';

  const prompt = `You are a friendly personal finance advisor for a Filipino user's expense tracker app called PocketBudget. Analyze their spending and give actionable, encouraging advice.

Here is the user's data:
- Total expenses recorded: ${expenses.length}
- Total spent: ₱${totalSpent.toFixed(2)}
- ${budgetInfo}

Category breakdown:
${categoryBreakdown || 'No expenses yet.'}

Please provide:
1. A brief 1-sentence spending summary
2. 3 specific, actionable tips based on their data (short, punchy)
3. A motivational closing line

Keep it casual, warm, and under 200 words total. Use ₱ for currency. Do NOT use markdown formatting — just plain text. Do NOT use emojis.`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI insights');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No insights available right now.';
};

export const getQuickTip = async (expenses, budgets) => {
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const categoryMap = {};
  expenses.forEach((e) => {
    const name = e.categories?.name || e.category_name || 'Other';
    categoryMap[name] = (categoryMap[name] || 0) + (e.amount || 0);
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
  const budgetInfo = budgets
    ? `Monthly budget: ₱${budgets.monthly || 0}`
    : 'No budget set.';

  const prompt = `You are a smart money coach for PocketBudget app. Based on the user's data, provide exactly 3 short tips/recommendations. Each tip should be 1 line max, starting with a bullet point (•).

User data:
- Total spent: ₱${totalSpent.toFixed(2)} across ${expenses.length} expenses
- Top category: ${topCategory ? `${topCategory[0]} (₱${topCategory[1].toFixed(2)})` : 'None'}
- ${budgetInfo}

Rules:
- Each tip on its own line starting with •
- Be specific to their data, not generic
- Use ₱ for currency
- No markdown, no numbering, no emojis
- Keep each under 15 words`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    }),
  });

  if (!response.ok) throw new Error('Failed to get tips');
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};
