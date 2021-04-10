let ctrlIsPressed = false
let ctrlIsUsed = false
let modChords = false

function chordsButton() {
  modChords = !modChords
  $('#addChords').toggleClass('active')
}

$(document).keydown(event => {
  if (event.which === 17) {
    ctrlIsPressed = true
    ctrlIsUsed = false
  }

  if (modChords) {
    if (event.key === 'Delete') {
      delete chords[progPos]
    }

    if (event.key === 'Backspace') {
      chords[progPos] = chords[progPos].slice(0, -1)
    }

    if (event.key.length === 1) {
      if (!chords[progPos]) {
        chords[progPos] = ''
      }
      chords[progPos] += event.key
    }

    const $chors = $('#chors')
    render()
  }
})

$(document).keyup(() => {
  if (ctrlIsPressed) {
    ctrlIsPressed = false
    if (ctrlIsUsed) {
      progPos++
    }
    render()
  }
})


let progression = []
let chords = {}
let progPos = 0

function add(note, multi) {
  if (multi && ctrlIsPressed) {
    if (progPos >= progression.length) {
      progression.push(note)
    } else {
      progression[progPos] += '+' + note
    }
    ctrlIsUsed = true
    render()
    return
  }

  if (progPos >= progression.length) {
    progression.push(note)
    progPos = progression.length
  } else {
    progression.splice(progPos, 0, note)
    progPos++
  }

  render()
}

function remove() {
  if (progPos < progression.length) {
    progression.splice(progPos, 1)
  }
  render()
}

function tabClicked(pos) {
  progPos = pos
  render()
}

function tabRequest(success, type, data, id) {
  const opts = {
    type: type,
    url: '/v1/tab',
    contentType: 'application/json',
    dataType: 'json',
    success: success
  }

  if (id) {
    opts.url += '/' + id
  }

  if (data) {
    opts.data = JSON.stringify(data)
  }
  $.ajax(opts)
}

function parseNotes() {
  progression.length = 0
  $('#notes').val().replace(/\n/g, ' ').split(' ').forEach(note => {
    if (note != '') {
      if (note === ' ') {
        note = '-'
      }
      progression.push(note)
    }
  })
  progPos = progression.length
  render()
}

const instruments = {
  guitar: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  mandolin: ['E5', 'A4', 'D4', 'G3'],
  banjo: ['D4', 'B3', 'G3', 'D3', 'G4'],
  bass: ['G2', 'D2', 'A1', 'E1'],
  ukelele: ['A4', 'E4', 'C4', 'G4']
}

const rawscale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const scale = []

let store = {}
let current = null

for (let i = 1; i <= 10; i++) {
  rawscale.forEach(note => scale.push(note + i))
}

function refreshTitles() {
  tabRequest(res => {
    store = {}
    $('#existing')
      .find('option')
      .remove()

    res.forEach(t => {
      $('#existing').append($('<option>', { value: t.uuid }).text(t.title))
      store[t.uuid] = t
    })
  }, 'GET')
}

function copyPaste() {
  const sel = window.getSelection()
  const a = sel.baseNode.parentElement.id.split('-')[1]
  const b = sel.extentNode.parentElement.id.split('-')[1]

  const start = Math.min(a, b)
  const stop = Math.max(a, b)

  progression.push(...progression.slice(start, stop + 1))
  render()
}

$(function () {
  $('#newline').click(() => add('|'))
  $('#space').click(() => add('-'))
  $('#remove').click(() => remove())
  $('#instrument').change(() => render())
  $('#modify').change(() => render())
  $('#notesParse').click(() => parseNotes())
  $('#copy').click(() => copyPaste())
  $('#addChords').click(() => chordsButton())

  for (let i = -5; i <= 6; i++) {
    if (i === 0) {
      $('#modifyNote').append($('<option>').text(i).attr('selected', 'selected'))
    } else if (i < 0) {
      $('#modifyNote').append($('<option>').text(i))
    } else {
      $('#modifyNote').append($('<option>').text('+' + i))
    }
  }
  $('#modifyNote').change(() => render())

  $('#fetch').click(() => {
    const uuid = $('#existing').val()
    progression = store[uuid].progression.split(' ')
    chords = store[uuid].chords
    $('#title').val(store[uuid].title)
    current = store[uuid]
    render()
  })

  $('#save').click(() => {
    if (current === null) {
      tabRequest(data => {
        current = data
        refreshTitles()
      }, 'POST', {
        title: $('#title').val(),
        progression: progression.join(' '),
        chords: chords
      })
    } else {
      tabRequest(() => refreshTitles(), 'PUT', {
        title: $('#title').val(),
        progression: progression.join(' '),
        chords: chords
      }, current.uuid)
    }
  })

  Object.keys(instruments).forEach(i => {
    $('#instrument').append($('<option>', { value: i }).text(i.replace(/^./, i[0].toUpperCase())))
  })

  refreshTitles()

  const row = $('<tr><td></td></tr>')
  for (let i = 0; i <= 12; i++) {
    row.append($('<td>' + i + '</td>'))
  }
  $('#neck').append(row)

  instruments.guitar.forEach(base => {
    const row = $('<tr><td>' + base + '</td></tr>')
    let neckClass = 'empty'
    for (let i = 0; i <= 12; i++) {
      row.append($('<td>X</td>').click(() => {
        let pos = scale.indexOf(base)
        pos += i
        add(scale[pos], true)
      }).addClass(neckClass))
      neckClass = 'band'
    }
    $('#neck').append(row)
  })

  render()
})

function findLowest(notes) {
  let lowest = scale.length
  notes.forEach(note => {
    const val = scale.indexOf(note)
    if (val < lowest && val >= 0) {
      lowest = val
    }
  })
  return lowest
}

function modifyChords(chords, modNotes) {
  if (modNotes === 0) {
    return JSON.parse(JSON.stringify(chords))
  }

  const newChords = {}

  Object.keys(chords).forEach(pos => {
    const old = chords[pos]
    let base = old.charAt(0)
    let other = old.slice(1)
    if (old.charAt(1) === '#') {
      base += '#'
      other = other.slice(1)
    }

    let sPos = rawscale.indexOf(base)
    if (sPos < 0) {
      console.log('Unknown chord!')
      return JSON.parse(JSON.stringify(chords))
    }

    sPos += modNotes
    sPos = sPos % rawscale.length

    if (sPos < 0) {
      sPos = rawscale.length + sPos
    }

    newChords[pos] = rawscale[sPos] + other
  })
  return newChords
}

function modify(notes, mod, modNotes) {
  if (mod === 0 && modNotes === 0) {
    return notes.slice() // should always return a copy
  }

  const nnotes = []
  notes.forEach(note => {
    if (note === '|' || note === ' ' || note === '-') {
      nnotes.push(note)
      return
    }

    if (modNotes !== 0) {
      let pos = scale.indexOf(note)
      pos += modNotes
      note = scale[pos]
    }

    if (mod !== 0) {
      const letter = note.slice(0, -1)
      let number = parseInt(note.slice(-1), 10)

      number += mod
      note = `${letter}${number}`
    }
    nnotes.push(note)
  })

  return nnotes
}

function render() {
  $('#notes').val(progression.join(' ').replace(/\| /g, '|\n'))
  const id = $('#instrument').val().toLowerCase()
  const neck = instruments[id]

  const result = {}
  let tab = ''

  neck.forEach(base => {
    result[base] = $('<div>' + base + ' | -</div>')
  })

  const modprog = modify(progression, parseInt($('#modify').val(), 10), parseInt($('#modifyNote').val(), 10))
  const modchords = modifyChords(chords, parseInt($('#modifyNote').val(), 10))

  modprog.push('-')

  const li = findLowest(neck)
  const ln = findLowest(modprog)

  $('.tabs').remove()
  $('#tabcontainer').text('')

  if (li > ln) {
    $('#tabcontainer').text('Cannot print progression, ' + scale[ln] + ' is lower than ' + scale[li])
    return
  }

  const addTab = (base, note, pos) => {
    let posclass = 'inactive'
    if (progPos === pos) {
      posclass = 'active'
    }
    result[base]
      .append($('<span>-</span>').attr('id', base + 'x-' + pos))
      .append(
        $('<span>' + note + '</span>')
          .addClass(posclass)
          .addClass('p' + pos)
          .attr('id', base + '-' + pos)
          .click(() => tabClicked(pos))
      )
  }

  let $chordDiv = $('<div></div>')
  $chordDiv.addClass('chords')
  modprog.forEach((note, pos) => {
    if (note === ' ' || note === '-') {
      neck.forEach(base => {
        addTab(base, '-', pos)
      })
      return;
    }

    if (note === '|') {
      const $div = $('<div></div>')
      neck.forEach(base => {
        $div.append(result[base])
        result[base] = $('<div>' + base + ' | -</div>')
      })
      $div.addClass('tabs')
      $('#tabcontainer').append($chordDiv)
      $('#tabcontainer').append($div)
      $chordDiv = $('<div></div>')
      $chordDiv.addClass('chords')
      return
    }
    
    const parts = note.split('+')
    const toAdd = {}
    let blank = '-'
    parts.forEach(note => {
      let candidate = note;
      let offset = 0
      while (neck.indexOf(candidate) < 0 && offset <= 100) {
        const p = scale.lastIndexOf(candidate)
        candidate = scale[p - 1]
        offset++
      }

      if (offset >= 100) {
        $('#tabcontainer').text('Cannot print progression, note ' + note + ' could not be found')
        return
      }

      toAdd[candidate] = '' + offset
      if (toAdd[candidate].length > blank.length) {
        blank = '-'.repeat(toAdd[candidate].length)
      }
    })

    neck.forEach(base => {
      if (toAdd[base]) {
        addTab(base, toAdd[base], pos)
      } else {
        addTab(base, blank, pos)
      }
    })
  })
  const $div = $('<div></div>')
  neck.forEach(base => {
    $div.append(result[base])
  })
  $div.addClass('tabs')
  $('#tabcontainer').append($chordDiv)
  $('#tabcontainer').append($div)

  Object.keys(modchords).forEach(pos => {
    const $chord = $('<span>' + modchords[pos] + '</span>')
    const $note = $('.p' + pos).first()
    console.log($note.offset().left)
    $chord.css('position', 'absolute')
    $chord.css('left', $note.offset().left - 8)
    $note.parent().parent().prev().append($chord)
  })

}
