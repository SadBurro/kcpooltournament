export function capitalizeName(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
        .join(' ');
}

export function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
  