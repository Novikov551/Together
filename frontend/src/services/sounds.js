// Генерируем звуки через Web Audio API — без файлов
let audioCtx = null
function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function playSequence(notes) {
  const ctx = getCtx()
  let time = ctx.currentTime
  notes.forEach(([freq, duration, type = 'sine', vol = 0.15]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + duration)
    time += duration * 0.6
  })
}

// Микрофон включён — короткий высокий бип
export function playMicOn() {
  playSequence([[800, 0.1], [1200, 0.1]])
}

// Микрофон выключён — короткий низкий бип
export function playMicOff() {
  playSequence([[400, 0.12], [300, 0.12]])
}

// Своя демонстрация включена — восходящий тон
export function playScreenShareOn() {
  playSequence([[500, 0.08], [700, 0.08], [1000, 0.12]])
}

// Своя демонстрация выключена — нисходящий тон
export function playScreenShareOff() {
  playSequence([[1000, 0.08], [700, 0.08], [500, 0.12]])
}

// Участник подключился к комнате — приветственный тон
export function playParticipantJoined() {
  playSequence([[523, 0.12, 'sine', 0.12], [659, 0.12, 'sine', 0.12], [784, 0.18, 'sine', 0.12]])
}

// Участник отключился от комнаты — нисходящий мягкий тон
export function playParticipantLeft() {
  playSequence([[784, 0.12, 'sine', 0.1], [523, 0.18, 'sine', 0.1]])
}

// Другой участник начал демонстрацию экрана — двойной бип
export function playRemoteScreenShareOn() {
  playSequence([[600, 0.08, 'triangle', 0.12], [900, 0.08, 'triangle', 0.12], [1200, 0.12, 'triangle', 0.12]])
}

// Другой участник остановил демонстрацию экрана — нисходящий двойной бип
export function playRemoteScreenShareOff() {
  playSequence([[1200, 0.08, 'triangle', 0.1], [900, 0.08, 'triangle', 0.1], [600, 0.12, 'triangle', 0.1]])
}

// Новое сообщение в чате — короткий мелодичный бип
export function playChatMessage() {
  playSequence([[880, 0.06, 'sine', 0.1], [1100, 0.1, 'sine', 0.08]])
}

// Выход из звонка — нисходящий мягкий тон
export function playLeaveCall() {
  playSequence([[600, 0.12, 'sine', 0.1], [400, 0.15, 'sine', 0.08], [250, 0.2, 'sine', 0.06]])
}