const EXACT_SELECTORS = [
  'button[aria-label="Good response"]',
  'button[aria-label="Bad response"]',
  'button[data-testid="good-response-turn-action-button"]',
  'button[data-testid="bad-response-turn-action-button"]'
];

const FUZZY_SELECTORS = [
  'button[aria-label*="good" i][aria-label*="response" i]',
  'button[aria-label*="bad" i][aria-label*="response" i]',
  'button[aria-label*="thumb" i]',
  'button[data-testid*="response" i]',
  'button[data-testid*="feedback" i]'
];

// Fuzzy keyword matching catches feedback buttons even if ChatGPT changes
// exact aria-labels or data-testid values in future updates
const KEYWORDS = [
  'good response',
  'bad response',
  'good-response',
  'bad-response',
  'thumbs up',
  'thumbs down',
  'thumbsup',
  'thumbsdown',
  'feedback-good',
  'feedback-bad',
  'feedback positive',
  'feedback negative'
];

// Marks buttons as processed to avoid double-removal when a button matches multiple selectors
const MARK_ATTRIBUTE = 'data-chatgpt-remove-feedback';
const SELECTOR = [...EXACT_SELECTORS, ...FUZZY_SELECTORS].join(', ');

const OBSERVER_OPTIONS = {
  childList: true,
  subtree: true
};

/**
 * Checks if text contains any feedback-related keywords
 */
const textMatchesFeedback = (value) => {
  const lower = value.toLowerCase();
  return KEYWORDS.some((keyword) => lower.includes(keyword));
};

/**
 * Determines if a button is a feedback button by checking attributes and content
 */
const isFeedbackButton = (button) => {
  if (!(button instanceof HTMLElement)) return false;
  if (button.getAttribute(MARK_ATTRIBUTE) === 'removed') return false;

  const candidates = [
    button.getAttribute('aria-label'),
    button.getAttribute('data-testid'),
    button.getAttribute('title'),
    button.textContent
  ].filter(Boolean);

  return candidates.some(textMatchesFeedback);
};

/**
 * Removes empty parent containers left behind after button removal
 */
const pruneEmptyParents = (start) => {
  let current = start;

  while (current && current instanceof HTMLElement && current !== document.body) {
    if (current.textContent.trim() !== '') {
      return;
    }

    if (current.childElementCount > 0) {
      return;
    }

    const parent = current.parentElement;
    current.remove();
    current = parent;
  }
};

/**
 * Removes a feedback button and cleans up empty containers
 */
const stripButton = (button) => {
  if (!(button instanceof HTMLElement)) return;
  if (button.getAttribute(MARK_ATTRIBUTE) === 'removed') return;

  const parent = button.parentElement;
  button.setAttribute(MARK_ATTRIBUTE, 'removed');
  button.remove();

  if (parent instanceof HTMLElement) {
    pruneEmptyParents(parent);
  }
};

/**
 * Finds and removes all feedback buttons on the page
 */
const stripAll = () => {
  const buttons = new Set(document.querySelectorAll(SELECTOR));
  buttons.forEach((button) => {
    if (isFeedbackButton(button)) {
      stripButton(button);
    }
  });
};

// Debounce timer to avoid excessive DOM queries on rapid mutations
let debounceTimer;

/**
 * Debounced version of stripAll to improve performance
 */
const stripAllDebounced = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      stripAll();
    } catch (error) {
      console.error('[ChatGPT Remove Feedback] Error:', error);
    }
  }, 100);
};

const observer = new MutationObserver(stripAllDebounced);

stripAll();

observer.observe(document.documentElement, OBSERVER_OPTIONS);
