import { getEmailLayout, getMoodEmoji } from './base.ts';

export interface OnThisDayEntry {
  id: string;
  date: string;
  text: string;
  mood?: number;
  tags?: string[];
  yearsAgo: number;
}

export interface OnThisDayData {
  userName: string;
  entries: OnThisDayEntry[];
  appUrl: string;
}

export const generateOnThisDayEmail = (data: OnThisDayData): string => {
  if (data.entries.length === 0) {
    return '';
  }

  const pluralYears = data.entries.length === 1 ? '' : 's';
  const entryWord = data.entries.length === 1 ? 'entry' : 'entries';

  const content = `
    <div class="header">
      <h1>⏰ On This Day</h1>
    </div>
    <div class="content">
      <p>Hi ${data.userName || 'there'},</p>

      <p>
        ${data.entries.length === 1
          ? `Today marks <strong>${data.entries[0].yearsAgo} year${data.entries[0].yearsAgo > 1 ? 's' : ''}</strong> since you wrote this reflection.`
          : `You have <strong>${data.entries.length} ${entryWord}</strong> from past years on this day.`
        }
        Let's take a moment to revisit your journey. 🌟
      </p>

      ${data.entries.map(entry => {
        const moodEmoji = entry.mood ? getMoodEmoji(entry.mood) : '';
        const dateObj = new Date(entry.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        return `
          <div class="entry-card">
            <div class="entry-date">
              ${formattedDate}
              ${moodEmoji ? `<span style="margin-left: 10px;">${moodEmoji}</span>` : ''}
              <span style="
                float: right;
                background-color: #667eea;
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
              ">${entry.yearsAgo} year${entry.yearsAgo > 1 ? 's' : ''} ago</span>
            </div>
            <div class="entry-text">
              ${entry.text.length > 300
                ? entry.text.substring(0, 300) + '...'
                : entry.text
              }
            </div>
            ${entry.tags && entry.tags.length > 0 ? `
              <div style="margin-top: 15px;">
                ${entry.tags.slice(0, 5).map(tag => `
                  <span style="
                    display: inline-block;
                    background-color: #e0e7ff;
                    color: #4338ca;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin: 4px 4px 4px 0;
                  ">${tag}</span>
                `).join('')}
              </div>
            ` : ''}
            <div style="margin-top: 15px;">
              <a href="${data.appUrl}/entry/${entry.id}" style="
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
              ">View Full Entry →</a>
            </div>
          </div>
        `;
      }).join('')}

      <div style="
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 20px;
        margin: 30px 0;
        text-align: center;
      ">
        <p style="margin: 0 0 15px 0; color: #555555; font-style: italic;">
          "The only way to make sense out of change is to plunge into it, move with it, and join the dance."<br>
          <span style="font-size: 14px; color: #999999;">— Alan Watts</span>
        </p>
        <a href="${data.appUrl}" class="button">Write Today's Entry</a>
      </div>

      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        Reflecting on your past helps you appreciate how far you've come. 💙
      </p>
    </div>
  `;

  const preheader = data.entries.length === 1
    ? `${data.entries[0].yearsAgo} year${data.entries[0].yearsAgo > 1 ? 's' : ''} ago today...`
    : `${data.entries.length} memories from this day`;

  return getEmailLayout(content, preheader);
};
