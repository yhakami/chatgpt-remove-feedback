const EXACT_SELECTORS = [
  'button[aria-label="Good response"]',
  'button[aria-label="Bad response"]',
  'button[data-testid="good-response-turn-action-button"]',
  'button[data-testid="bad-response-turn-action-button"]',
  'button[aria-label="Like this image"]',
  'button[aria-label="Dislike this image"]'
];

const FUZZY_SELECTORS = [
  'button[aria-label*="good" i][aria-label*="response" i]',
  'button[aria-label*="bad" i][aria-label*="response" i]',
  'button[aria-label*="thumb" i]',
  'button[data-testid*="response" i]',
  'button[data-testid*="feedback" i]',
  'button[aria-label*="like this" i]',
  'button[aria-label*="dislike this" i]'
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
  'feedback negative',
  'like this image',
  'dislike this image',
  'like-image',
  'dislike-image'
];

// Captures chat-level helpfulness prompts that wrap feedback buttons in newer layouts
const PROMPT_TEXT_SNIPPETS = [
  'is this conversation helpful',
  'is this chat helpful'
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
 * Determines whether an element is the helpfulness prompt container
 */
const isHelpfulPromptContainer = (element) => {
  if (!(element instanceof HTMLElement)) return false;
  if (element.getAttribute(MARK_ATTRIBUTE) === 'removed') return false;

  const text = element.textContent?.toLowerCase() ?? '';
  if (!PROMPT_TEXT_SNIPPETS.some((snippet) => text.includes(snippet))) {
    return false;
  }

  const buttons = element.querySelectorAll('button');
  return buttons.length >= 2 && buttons.length <= 4;
};

/**
 * Walks up the tree from a button to find the helpfulness prompt wrapper
 */
const findHelpfulPromptContainer = (button) => {
  let current = button.parentElement;

  while (current && current instanceof HTMLElement && current !== document.body) {
    if (isHelpfulPromptContainer(current)) {
      return current;
    }

    // Stop climbing once we hit a chat turn or main layout containers so we don't remove too much
    if (current.matches('main, article, section, form')) {
      return null;
    }

    current = current.parentElement;
  }

  return null;
};

/**
 * Finds and removes all feedback buttons on the page
 */
const stripAll = () => {
  const buttons = new Set(document.querySelectorAll(SELECTOR));
  buttons.forEach((button) => {
    if (isFeedbackButton(button)) {
      const promptContainer = findHelpfulPromptContainer(button);
      stripButton(button);

      if (promptContainer) {
        promptContainer.setAttribute(MARK_ATTRIBUTE, 'removed');
        const parent = promptContainer.parentElement;
        promptContainer.remove();

        if (parent instanceof HTMLElement) {
          pruneEmptyParents(parent);
        }
      }
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
