// Lock screen toggle handler
document.getElementById('enterDesktop').addEventListener('click', () => {
    console.log('Lock screen hidden, desktop visible');
    document.getElementById('welcomeScreen').classList.add('hidden');
});