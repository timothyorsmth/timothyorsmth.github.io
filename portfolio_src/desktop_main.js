import { animate, splitText, stagger, random, globals } from 'animejs';

// Lock screen toggle handler
document.getElementById('enterDesktop').addEventListener('click', () => {
    console.log('Lock screen hidden, desktop visible');
    document.getElementById('welcomeScreen').classList.add('hidden');
});

anime({
  targets: '.welcomeScreen-background',
  translateX: ['0%', '-50%'],
  duration: 8000,
  easing: 'linear',
  loop: true
});