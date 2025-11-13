import { getEmailLayout } from './base.ts';

export interface StreakReminderData {
  userName: string;
  currentStreak: number;
  longestStreak: number;
  appUrl: string;
  type: 'maintain' | 'recovery' | 'milestone';
  milestone?: number;
}

export const generateStreakReminder = (data: StreakReminderData): string => {
  let heading = '';
  let message = '';
  let cta = 'Continue Your Streak';

  switch (data.type) {
    case 'maintain':
      heading = '🔥 Don\'t Break Your Streak!';
      message = `
        <p>Hi ${data.userName || 'there'},</p>
        <p>
          You're on a <strong>${data.currentStreak}-day streak</strong>!
          You've been doing amazing work with your daily reflections. 🎉
        </p>
        <p>
          Don't let today be the day that breaks your momentum.
          Take a few minutes to write about your day, and keep the streak alive.
        </p>
      `;
      break;

    case 'recovery':
      heading = '💙 We Miss You!';
      message = `
        <p>Hi ${data.userName || 'there'},</p>
        <p>
          We noticed you haven't journaled in a few days.
          ${data.longestStreak > 0
            ? `Remember your ${data.longestStreak}-day streak? You can build that momentum again!`
            : 'Starting a new streak is just one entry away!'
          }
        </p>
        <p>
          Life gets busy, but taking a moment for self-reflection can make all the difference.
          Your future self will thank you. 🌟
        </p>
      `;
      cta = 'Start Fresh Today';
      break;

    case 'milestone':
      heading = `🏆 ${data.milestone}-Day Milestone!`;
      message = `
        <p>Hi ${data.userName || 'there'},</p>
        <p>
          Congratulations! You've reached a <strong>${data.milestone}-day streak</strong>!
          This is a huge achievement. 🎊
        </p>
        <p>
          You've shown incredible dedication to personal growth and self-reflection.
          Keep going—each entry is a step toward a better understanding of yourself.
        </p>
        ${data.longestStreak === data.milestone
          ? '<p><em>This is your longest streak yet! Amazing work! 🌟</em></p>'
          : ''
        }
      `;
      cta = 'Keep the Momentum Going';
      break;
  }

  const content = `
    <div class="header">
      <h1>${heading}</h1>
    </div>
    <div class="content">
      ${message}

      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 30px;
        margin: 30px 0;
        text-align: center;
        color: white;
      ">
        <div style="font-size: 48px; margin-bottom: 10px;">🔥</div>
        <div style="font-size: 36px; font-weight: 700; margin-bottom: 5px;">
          ${data.currentStreak}
        </div>
        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
          Day Streak
        </div>
        ${data.longestStreak > data.currentStreak ? `
          <div style="
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 14px;
            opacity: 0.9;
          ">
            Longest Streak: ${data.longestStreak} days
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.appUrl}" class="button">${cta}</a>
      </div>

      ${data.type === 'maintain' ? `
        <div style="
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 4px;
        ">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⏰ <strong>Time is running out!</strong> You have until midnight to maintain your streak.
          </p>
        </div>
      ` : ''}

      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        Consistency is the key to meaningful growth. Keep writing! ✍️
      </p>
    </div>
  `;

  const preheader = data.type === 'milestone'
    ? `You've reached ${data.milestone} days! 🎉`
    : `Your ${data.currentStreak}-day streak needs you!`;

  return getEmailLayout(content, preheader);
};
