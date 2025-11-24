import { getEmailLayout, getMoodColor, getMoodEmoji, getSentimentColor } from './base.ts';

export interface WeeklyDigestData {
  userName: string;
  weekStart: string;
  weekEnd: string;
  totalEntries: number;
  averageMood: number;
  dominantSentiment: string;
  topTags: string[];
  moodTrend: string; // 'improving' | 'declining' | 'stable'
  aiSummary: string;
  appUrl: string;
}

export const generateWeeklyDigest = (data: WeeklyDigestData): string => {
  const moodEmoji = getMoodEmoji(Math.round(data.averageMood));
  const moodColor = getMoodColor(Math.round(data.averageMood));

  const trendEmoji = {
    improving: '📈',
    declining: '📉',
    stable: '➡️',
  }[data.moodTrend] || '➡️';

  const content = `
    <div class="header">
      <h1>✨ Your Weekly Reflection</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName || 'there'},</p>

      <p>Here's your personalized summary for <strong>${data.weekStart}</strong> to <strong>${data.weekEnd}</strong>.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div class="stat-box">
          <span class="stat-value">${data.totalEntries}</span>
          <span class="stat-label">Entries</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${moodEmoji} ${data.averageMood.toFixed(1)}</span>
          <span class="stat-label">Avg Mood</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${trendEmoji}</span>
          <span class="stat-label">Trend</span>
        </div>
      </div>

      <h2 style="color: #333333; font-size: 20px; margin-top: 40px;">🎯 This Week's Insights</h2>
      <div class="entry-card">
        <p style="margin: 0; white-space: pre-wrap;">${data.aiSummary}</p>
      </div>

      ${data.topTags.length > 0 ? `
        <h3 style="color: #333333; font-size: 18px; margin-top: 30px;">🏷️ Dominant Themes</h3>
        <div style="margin: 15px 0;">
          ${data.topTags.map(tag => `
            <span style="
              display: inline-block;
              background-color: #e0e7ff;
              color: #4338ca;
              padding: 6px 12px;
              border-radius: 16px;
              font-size: 14px;
              margin: 4px;
            ">${tag}</span>
          `).join('')}
        </div>
      ` : ''}

      <div style="
        background-color: #f0f4ff;
        border-radius: 8px;
        padding: 20px;
        margin: 30px 0;
        text-align: center;
      ">
        <p style="margin: 0 0 15px 0; color: #555555;">
          Overall, your emotional state this week was <strong style="color: ${getSentimentColor(data.dominantSentiment)}">${data.dominantSentiment.toLowerCase()}</strong> ${trendEmoji}
        </p>
        <a href="${data.appUrl}/insights" class="button">View Detailed Insights</a>
      </div>

      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        Keep up the great work! Consistent reflection is key to personal growth. 🌱
      </p>
    </div>
  `;

  return getEmailLayout(content, `Your weekly summary: ${data.totalEntries} entries, ${moodEmoji} ${data.averageMood.toFixed(1)} avg mood`);
};
