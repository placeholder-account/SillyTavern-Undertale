import {getContext} from "../../../extensions.js";
import {event_types, eventSource} from "../../../../script.js";

const extensionName = "SillyTavern-Undertale";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

class UndertaleManager {
  constructor() {
      this.activeSequences = new Map();
      this.fontMap = {};
      this.loadFonts();
      this.init();
  }

    init() {
        console.log('[Undertale] Setting up event listeners');

        eventSource.on(event_types.CHAT_CHANGED, () => {
            setTimeout(() => {
                this.processMessages();
                this.createFakeCursor();
                const allUndertaleMessages = document.querySelectorAll('.mes');
                allUndertaleMessages.forEach(messageEl => {
                    const textboxes = messageEl.querySelectorAll('.custom-undertale-textbox');
                    const sounds = messageEl.querySelectorAll('.custom-undertale-sound');
                    const sprites = messageEl.querySelectorAll('.custom-character-sprite');
                    sprites.forEach(sprite => this.setupImageFallback(sprite));

                    [...textboxes, ...sounds].forEach(element => {
                        element.style.display = 'block';

                        const character = element.getAttribute('data-character') || null;
                        const font = this.getFontForCharacter(character);
                        if (font) {
                            element.style.fontFamily = font;
                        }

                        const content = element.querySelector('.custom-textbox-content');
                        if (content) {
                            const walker = document.createTreeWalker(
                                content,
                                NodeFilter.SHOW_TEXT,
                                {
                                    acceptNode: function (node) {
                                        if (node.parentElement.classList.contains('custom-dialogue-asterisk')) {
                                            return NodeFilter.FILTER_REJECT;
                                        }
                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                }
                            );

                            let node;
                            let isFirst = true;
                            while (node = walker.nextNode()) {
                                if (isFirst) {
                                    node.textContent = node.textContent.replace(/^\n+/, '');
                                    isFirst = false;
                                }
                            }
                        } else if (element.classList.contains('custom-undertale-sound')) {
                            const soundFile = element.getAttribute('data-sound');

                            const sfxButton = document.createElement('button');
                            sfxButton.textContent = '$ SFX';
                            sfxButton.className = 'undertale-sfx-btn';
                            sfxButton.onclick = () => {
                                this.playSound(`sfx/${soundFile}.mp3`, 0.5);
                            };

                            sfxButton.addEventListener('mouseenter', (e) => {
                                const fakeCursor = document.getElementById('fake-cursor');
                                const rect = sfxButton.getBoundingClientRect();
                                sfxButton.style.cursor = 'none';
                                this.playSound('select.mp3', 0.5);
                                fakeCursor.style.left = (rect.left + 17) + 'px';
                                fakeCursor.style.top = (rect.top + rect.height / 2 - 7) + 'px';
                                fakeCursor.style.display = 'block';
                            });

                            sfxButton.addEventListener('mouseleave', () => {
                                const fakeCursor = document.getElementById('fake-cursor');
                                sfxButton.style.cursor = 'pointer';
                                fakeCursor.style.display = 'none';
                            });

                            element.parentNode.insertBefore(sfxButton, element.nextSibling);
                        }
                    });

                    const buttons = messageEl.querySelectorAll('.undertale-next-btn');
                    buttons.forEach(btn => btn.style.display = 'none');
                });
                this.setupAllMessagesForInteraction();
            }, 100);
        });

        eventSource.on(event_types.USER_MESSAGE_RENDERED, (messageId) => {
            const messageEl = document.querySelector(`[mesid="${messageId}"]`);

            if (messageEl) {
                messageEl.removeAttribute('data-undertale-processed');

                this.playSound('confirm.mp3', 0.5);
                this.processMessage(messageEl, messageId);

                messageEl.setAttribute('data-undertale-processed', 'true');
            }
        });

        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
            const messageEl = document.querySelector(`[mesid="${messageId}"]`);

            if (messageEl) {
                messageEl.removeAttribute('data-undertale-processed');

                this.processMessage(messageEl, messageId);

                messageEl.setAttribute('data-undertale-processed', 'true');
            }
        });

        eventSource.on(event_types.MESSAGE_SWIPED, () => {
            const context = getContext();
            const lastMessageId = context.chat.length - 1;
            const messageEl = document.querySelector(`[mesid="${lastMessageId}"]`);

            if (messageEl) {
                messageEl.removeAttribute('data-undertale-processed');
                this.processMessage(messageEl, lastMessageId.toString());
                messageEl.setAttribute('data-undertale-processed', 'true');
            }
        });

        eventSource.on(event_types.MESSAGE_UPDATED, (messageId) => {
            const messageEl = document.querySelector(`[mesid="${messageId}"]`);

            if (messageEl) {

                messageEl.removeAttribute('data-undertale-processed');

                this.processMessage(messageEl, messageId);

                messageEl.setAttribute('data-undertale-processed', 'true');
            }
        });

    }

    getFontForCharacter(character) {
        return this.fontMap[character] || null;
    }

    async loadFonts() {
        try {
            const response = await fetch(`/${extensionFolderPath}/fonts/fonts.json`);
            if (!response.ok) {
                console.log('[Undertale] fonts.json not found, using default fonts');
                return;
            }
            this.fontMap = await response.json();
        } catch (error) {
            console.log('[Undertale] Error loading fonts.json:', error);
            this.fontMap = {};
        }
    }

    setupAllMessagesForInteraction() {
        console.log('[Undertale] Setting up all messages for interaction');

        const allMessages = document.querySelectorAll('.mes[data-undertale-processed]');

        allMessages.forEach(messageEl => {
            const textboxes = messageEl.querySelectorAll('.custom-undertale-textbox');

            if (textboxes.length > 0) {
                textboxes.forEach(textbox => {
                    const character = textbox.getAttribute('data-character') || null;

                    const font = this.getFontForCharacter(character);
                    if (font) {
                        textbox.style.fontFamily = font;
                    }

                    const speed = this.convertSpeed(textbox.getAttribute('data-speed') || 'normal');
                    const mouthSpeed = this.convertMouthSpeed(textbox.getAttribute('data-speed') || 'normal');
                    const content = textbox.querySelector('.custom-textbox-content');
                    const volumeMultiplier = this.applyExtraEffects(textbox);

                    if (!content) return;

                    const { textOnly, textNodes } = this.extractTextContent(content);

                    textbox.style.cursor = 'pointer';
                    const typingState = { isTyping: false };
                    textbox.onclick = () => {
                        if (typingState.isTyping) {
                            typingState.isTyping = false;
                            textNodes[0].textContent = textOnly;
                        } else {
                            textNodes.forEach(node => node.textContent = '');
                            typingState.isTyping = true;
                            const shouldTalk = textbox.getAttribute('data-talking') === 'true';
                            if (shouldTalk) {
                                const spriteImg = textbox.querySelector('.custom-character-sprite');
                                this.startSpriteAnimation(spriteImg, typingState, mouthSpeed);
                            }
                            this.typeWriter(textNodes[0], textOnly, speed, character, typingState, volumeMultiplier);
                        }
                    };
                });
            }
        });
    }

    setupImageFallback(img) {
        img.onerror = () => {
            const currentSrc = img.src;

            if (currentSrc.includes('Default-san/thinking/neutral.png') ||
                currentSrc.includes('Default-san/talking/neutral.png')) {
                console.log('[Undertale] Default fallback image also failed to load');
                return;
            }

            const isThinking = currentSrc.includes('/thinking/');
            const folder = isThinking ? 'thinking' : 'talking';

            img.src = `/${extensionFolderPath}/images/Default-san/${folder}/neutral.png`;

        };

        if (img.complete && img.naturalWidth === 0) {
            img.src = img.src;
        }
    }

    createFakeCursor() {
        if (document.getElementById('fake-cursor')) return;

        const fakeCursor = document.createElement('div');
        fakeCursor.id = 'fake-cursor';
        fakeCursor.style.cssText = `
        position: fixed;
        width: 16px;
        height: 16px;
        background-image: url('/${extensionFolderPath}/images/soul.png');
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        z-index: 9999;
        display: none;
    `;
        document.body.appendChild(fakeCursor);
    }

    processMessages() {
        const chatContainer = document.querySelector('#chat');

        if (!chatContainer) return;

        const messages = document.querySelectorAll('.mes:not([data-undertale-processed])');

        messages.forEach(messageEl => {
            const messageId = messageEl.getAttribute('mesid') || Date.now().toString();
            this.processMessage(messageEl, messageId);
            messageEl.setAttribute('data-undertale-processed', 'true');
        });
    }

    processMessage(messageEl, messageId) {
        const mesText = messageEl.querySelector('.mes_text');

        if (!mesText) return;

        const sprites = mesText.querySelectorAll('.custom-character-sprite');
        sprites.forEach(sprite => this.setupImageFallback(sprite));

        const textboxes = mesText.querySelectorAll('.custom-undertale-textbox');
        const sounds = mesText.querySelectorAll('.custom-undertale-sound');

        if (textboxes.length > 0 || sounds.length > 0) {
            this.setupSequence(messageEl, messageId);
        }
    }

    async playSound(soundFile, volume = 0.6) {
        const fullPath = soundFile.startsWith('/') ? soundFile : `/${extensionFolderPath}/sounds/${soundFile}`;

        const audio = new Audio(fullPath);
        audio.volume = volume;
        const fallbackAudio = new Audio(`/${extensionFolderPath}/sounds/txt.mp3`);
        fallbackAudio.volume = volume;
        audio.play().catch(e => {
            fallbackAudio.play().catch(e => console.log('[Undertale] Audio play failed:', e));
        });
    }

    setupSequence(messageEl, messageId) {
      const elements = messageEl.querySelectorAll('.custom-undertale-textbox, .custom-undertale-sound');

      if (elements.length === 0) return;

      const existingButtons = messageEl.querySelectorAll('.undertale-next-btn');
      existingButtons.forEach(btn => btn.remove());

      this.activeSequences.set(messageId, {
          elements: Array.from(elements),
          currentIndex: 0
      });

      const nextButton = document.createElement('button');
      nextButton.textContent = '* NEXT';
      nextButton.className = 'undertale-next-btn';
      nextButton.onclick = () => {
          this.playSound('confirm.mp3', 0.5);
          this.showNext(messageId);
      }

      nextButton.addEventListener('mouseenter', (e) => {
          const fakeCursor = document.getElementById('fake-cursor');
          const rect = nextButton.getBoundingClientRect();

          nextButton.style.cursor = 'none';
          this.playSound('select.mp3', 0.5);

          fakeCursor.style.left = (rect.left + 17) + 'px';
          fakeCursor.style.top = (rect.top + rect.height / 2 - 7) + 'px';
          fakeCursor.style.display = 'block';
      });

      nextButton.addEventListener('mouseleave', () => {
          const fakeCursor = document.getElementById('fake-cursor');
            nextButton.style.cursor = 'pointer';
            fakeCursor.style.display = 'none';
      });

      const lastElement = elements[elements.length - 1];
      lastElement.parentNode.insertBefore(nextButton, lastElement.nextSibling);
    }

    convertSpeed(speedStr) {
        const speeds = {
            'very_slow': 110,
            'slower': 80,
            'normal': 60,
            'faster': 48,
            'very_fast': 33
        };
        return speeds[speedStr] || 60;
    }

    convertMouthSpeed(speedStr) {
        const speeds = {
            'very_slow': 400,
            'slower': 300,
            'normal': 200,
            'faster': 150,
            'very_fast': 100
        };
        return speeds[speedStr] || 200;
    }

    showNext(messageId) {
        const sequence = this.activeSequences.get(messageId);
        if (!sequence || sequence.currentIndex >= sequence.elements.length) return;

        const element = sequence.elements[sequence.currentIndex];

        if (element.classList.contains('custom-undertale-textbox')) {
            const character = element.getAttribute('data-character') || null;

            const font = this.getFontForCharacter(character);
            if (font) {
                element.style.fontFamily = font;
            }

            const speed = this.convertSpeed(element.getAttribute('data-speed') || 'normal');
            const mouthSpeed = this.convertMouthSpeed(element.getAttribute('data-speed') || 'normal');
            const content = element.querySelector('.custom-textbox-content');
            const volumeMultiplier = this.applyExtraEffects(element);

            element.style.display = 'block';
            element.style.cursor = 'pointer';

            const { textOnly, textNodes } = this.extractTextContent(content);
            textNodes.forEach(node => node.textContent = '');

            const typingState = { isTyping: true };
            element.onclick = () => {
                if (typingState.isTyping) {
                    typingState.isTyping = false;
                    textNodes[0].textContent = textOnly;
                } else {
                    textNodes[0].textContent = '';
                    typingState.isTyping = true;
                    const shouldTalk = element.getAttribute('data-talking') === 'true';
                    if (shouldTalk) {
                        const spriteImg = element.querySelector('.custom-character-sprite');
                        this.startSpriteAnimation(spriteImg, typingState, mouthSpeed);
                    }
                    this.typeWriter(textNodes[0], textOnly, speed, character, typingState, volumeMultiplier);
                }
            };
            const shouldTalk = element.getAttribute('data-talking') === 'true';
            if (shouldTalk) {
                const spriteImg = element.querySelector('.custom-character-sprite');
                this.startSpriteAnimation(spriteImg, typingState, mouthSpeed);
            }
            this.typeWriter(textNodes[0], textOnly, speed, character, typingState, volumeMultiplier);
        } else if (element.classList.contains('custom-undertale-sound')) {

            const soundFile = element.getAttribute('data-sound');
            this.playSound(`sfx/${soundFile}.mp3`, 0.5);

            const sfxButton = document.createElement('button');
            sfxButton.textContent = '$ SFX';
            sfxButton.className = 'undertale-sfx-btn';
            sfxButton.onclick = () => {
                this.playSound(`sfx/${soundFile}.mp3`, 0.5);
            };

            sfxButton.addEventListener('mouseenter', (e) => {
                const fakeCursor = document.getElementById('fake-cursor');
                const rect = sfxButton.getBoundingClientRect();
                sfxButton.style.cursor = 'none';
                this.playSound('select.mp3', 0.5);
                fakeCursor.style.left = (rect.left + 17) + 'px';
                fakeCursor.style.top = (rect.top + rect.height / 2 - 7) + 'px';
                fakeCursor.style.display = 'block';
            });

            sfxButton.addEventListener('mouseleave', () => {
                const fakeCursor = document.getElementById('fake-cursor');
                sfxButton.style.cursor = 'pointer';
                fakeCursor.style.display = 'none';
            });

            element.parentNode.insertBefore(sfxButton, element.nextSibling);
        }

        sequence.currentIndex++;

        if (sequence.currentIndex >= sequence.elements.length) {
            const button = document.querySelector(`[mesid="${messageId}"] .undertale-next-btn`);
            if (button) button.style.display = 'none';
            this.activeSequences.delete(messageId);
        }

    }

    typeWriter(element, text, speed, character, typingState, volumeMultiplier = 0.6) {
        let i = 0;

        const type = () => {
            if (i < text.length && typingState.isTyping) {
            element.textContent += text.charAt(i);

              if (text.charAt(i).trim()) {
                  const soundFile = character ? `/sounds/${character}/voice.mp3` : 'txt.mp3';
                  this.playSound(soundFile, volumeMultiplier);
              }

              let delay = speed;

              if (text.charAt(i) === '.' || text.charAt(i) === ';' || text.charAt(i) === '—' || text.charAt(i) === '–'
              || text.charAt(i) === '?' || text.charAt(i) === '!') {
                  delay = speed * 4;
              } else if (text.charAt(i) === '\n') {
                  delay = speed * 6;
              } else if (text.charAt(i) === ",") {
                  delay = speed * 2;
              }

              i++;
              setTimeout(type, delay);
          } else if (i >= text.length) {
              typingState.isTyping = false;
          }
        };

        type();
    }

    startSpriteAnimation(spriteImg, typingState, mouthSpeed) {
        if (!spriteImg || !spriteImg.src) return;

        const originalSrc = spriteImg.src;
        const talkingSrc = originalSrc.replace('/thinking/', '/talking/');

        let isTalking = false;

        const animate = () => {
            if (!typingState.isTyping) {
                spriteImg.src = originalSrc;
                return;
            }

            isTalking = !isTalking;
            spriteImg.src = isTalking ? talkingSrc : originalSrc;
            this.setupImageFallback(spriteImg);

            setTimeout(animate, mouthSpeed);
        };

        animate();
    }

    applyExtraEffects(textbox) {
        const extra = textbox.getAttribute('data-extra');

        if (extra === 'loud') {
            textbox.classList.add('undertale-loud');
            return 1.0;
        } else if (extra === 'quiet') {
            textbox.classList.add('undertale-quiet');
            return 0.3;
        } else {
            return 0.6;
        }
    }

    extractTextContent(content) {
        const textNodes = [];
        let textOnly = '';
        let isFirstNode = true;

        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement.classList.contains('custom-dialogue-asterisk')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);

            let nodeText = node.textContent;
            if (isFirstNode) {
                nodeText = nodeText.replace(/^\n+/, '');
                isFirstNode = false;
            }

            textOnly += nodeText;
        }

        return { textOnly, textNodes };
    }

}

jQuery(async () => {
    console.log('[Undertale] Extension loading');
    new UndertaleManager();
});
