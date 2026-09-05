function parseTimeToMinutes(str){
  str = String(str).trim();
  if(str.includes(':')){
    const parts = str.split(':');
    return parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 60;
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function formatTime(minutes){
  if(Number.isInteger(minutes)) return minutes;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return m + ':' + String(s).padStart(2, '0');
}

function getNoteClass(note){
  if(!note) return 'note-default';
  const lower = note.toLowerCase();
  if(lower.includes('charge') || lower.includes('preheat')) return 'note-charge';
  if(lower.includes('high') || lower.includes('full') || lower.includes('max')) return 'note-high';
  if(lower.includes('medium') || lower.includes('med')) return 'note-medium';
  if(lower.includes('low') || lower.includes('reduce') || lower.includes('decrease')) return 'note-low';
  if(lower.includes('hold') || lower.includes('maintain')) return 'note-hold';
  return 'note-default';
}

function parseCSVLine(line){
  const result = [];
  let current = '';
  let inQuotes = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"'){
      if(inQuotes && line[i+1] === '"'){
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if(ch === ',' && !inQuotes){
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function extractNumber(text){
  const t = text.toLowerCase();
  const m = t.match(/(\d{2,4})(?:\s*(?:degrees|degree|fahrenheit|f\b))?/);
  if(m) return parseInt(m[1]);

  const digitWords = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
    sixteen:16, seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
    hundred:100, thousand:1000
  };

  const words = t.replace(/[^a-z\s]/g,' ').split(/\s+/).filter(function(w){return w.length>0;});

  let result = 0;
  let group = 0;
  for(let i=0;i<words.length;i++){
    const w = words[i];
    const n = digitWords[w];
    if(n === 100 || n === 1000){
      group = (group || 1) * n;
    } else if(n >= 20){
      group += n;
    } else if(n >= 0){
      group += n;
    } else if(w === 'and'){
      continue;
    } else if(group > 0){
      result += group;
      group = 0;
    }
  }
  result += group;
  if(result >= 150 && result <= 600) return result;

  if(words.length >= 2){
    const first = digitWords[words[0]];
    const second = digitWords[words[1]];
    if(first >= 1 && first <= 9 && second >= 10 && second <= 99){
      const combo = first * 100 + second;
      if(combo >= 150 && combo <= 600) return combo;
    }
  }

  return null;
}
