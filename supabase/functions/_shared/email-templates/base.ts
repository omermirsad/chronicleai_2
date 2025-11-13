// Base email template with consistent styling

export const getEmailLayout = (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Chronicle AI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .footer {
      padding: 30px;
      text-align: center;
      color: #999999;
      font-size: 12px;
      border-top: 1px solid #eeeeee;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .mood-indicator {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin: 5px;
    }
    .entry-card {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .entry-date {
      color: #667eea;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .entry-text {
      color: #555555;
      line-height: 1.6;
    }
    .stat-box {
      display: inline-block;
      background-color: #f0f4ff;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 10px 5px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      display: block;
    }
    .stat-label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .stat-box {
        display: block;
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    ${content}
    <div class="footer">
      <p><strong>Chronicle AI</strong> - Your AI-Powered Journal</p>
      <p>
        <a href="{{unsubscribe_url}}" style="color: #999999;">Unsubscribe</a> |
        <a href="{{app_url}}/settings" style="color: #999999;">Email Preferences</a>
      </p>
      <p style="margin-top: 20px;">
        You're receiving this because you opted in to email notifications.<br>
        © ${new Date().getFullYear()} Chronicle AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const getMoodColor = (mood: number): string => {
  const colors = {
    1: '#ef4444', // red
    2: '#f97316', // orange
    3: '#eab308', // yellow
    4: '#22c55e', // green
    5: '#3b82f6', // blue
  };
  return colors[mood as keyof typeof colors] || '#6b7280';
};

export const getMoodEmoji = (mood: number): string => {
  const emojis = {
    1: '😢',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😄',
  };
  return emojis[mood as keyof typeof emojis] || '😐';
};

export const getSentimentColor = (sentiment: string): string => {
  const colors: Record<string, string> = {
    Positive: '#22c55e',
    Negative: '#ef4444',
    Neutral: '#6b7280',
    Mixed: '#eab308',
  };
  return colors[sentiment] || '#6b7280';
};
