function renderProfileTable(){
  const tbody = document.getElementById('profileTableBody');
  tbody.innerHTML = '';
  
  profileSteps.forEach((step, idx) => {
    const row = document.createElement('tr');
    const noteClass = getNoteClass(step.note);
    const timeStr = formatTime(step.time);
    
    row.innerHTML = `
      <td class="time-cell"><input type="text" value="${timeStr}" onchange="updateStepFromTable(${idx}, 'time', this.value)"></td>
      <td class="target-cell"><input type="number" value="${step.target || ''}" onchange="updateStepFromTable(${idx}, 'target', this.value)"></td>
      <td class="note-cell"><input type="text" value="${step.note || ''}" class="${noteClass}" onchange="updateStepFromTable(${idx}, 'note', this.value)"></td>
      <td class="action-cell"><button class="delete-btn" onclick="deleteStep(${idx})">×</button></td>
    `;
    tbody.appendChild(row);
  });
}

function updateStepFromTable(idx, field, value){
  if(field === 'time'){
    profileSteps[idx].time = parseTimeToMinutes(value);
  } else if(field === 'target'){
    const tv = parseFloat(value);
    profileSteps[idx].target = isNaN(tv) ? null : tv;
  } else if(field === 'note'){
    profileSteps[idx].note = value.trim();
  }
  profileSteps.sort((a, b) => a.time - b.time);
  renderProfileTable();
}

function addStepRow(){
  const lastTime = profileSteps.length > 0 ? profileSteps[profileSteps.length - 1].time + 1 : 0;
  profileSteps.push({ time: lastTime, target: null, note: '', spoken: false });
  profileSteps.sort((a, b) => a.time - b.time);
  renderProfileTable();
}

function deleteStep(idx){
  profileSteps.splice(idx, 1);
  renderProfileTable();
}

function setProfile(steps){
  profileSteps = steps.sort((a,b) => a.time - b.time);
  renderProfileTable();
}

function loadSample(){
  const sampleSteps = [
    {time: 0, target: 200, note: 'Charge — high flame'},
    {time: 1, target: 220, note: 'high flame'},
    {time: 2, target: 245, note: 'medium flame — Maillard'},
    {time: 3, target: 270, note: 'medium flame'},
    {time: 4, target: 295, note: 'medium flame'},
    {time: 5, target: 320, note: 'reduce to low'},
    {time: 6, target: 345, note: 'low flame'},
    {time: 7, target: 370, note: 'low flame'},
    {time: 8, target: 395, note: 'first crack expected'},
    {time: 9, target: 420, note: 'hold temperature'},
    {time: 10, target: 440, note: 'reduce gas'},
    {time: 11, target: 455, note: 'second crack zone'}
  ];
  setProfile(sampleSteps);
  document.getElementById('profileName').value = 'default';
}

function profileToCSV(){
  let csv = 'Time,Target,Note\n';
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    const t = step.target !== null ? step.target : '';
    const n = (step.note || '').replace(/"/g, '""');
    const timeStr = formatTime(step.time);
    csv += timeStr+','+t+',"'+n+'"\n';
  }
  return csv;
}

function saveProfileCSV(){
  const name = document.getElementById('profileName').value.trim() || 'profile';
  const csv = profileToCSV();
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '.csv';
  a.click();
  console.log('[PROFILE] Saved profile as', name + '.csv');
}

function loadProfileCSV(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const text = e.target.result;
    console.log('[PROFILE] Loading CSV:', file.name);
    parseProfileCSV(text);
    document.getElementById('profileName').value = file.name.replace(/\.csv$/i, '');
  };
  reader.readAsText(file);
  input.value = '';
}

function parseProfileCSV(csvText){
  const lines = csvText.trim().split(/\r?\n/);
  const steps = [];
  let header = true;
  let timeCol = 0, targetCol = 1, noteCol = 2;

  for(let line of lines){
    line = line.trim();
    if(!line) continue;
    if(header){
      const parts = parseCSVLine(line);
      const lower = parts.map(p => p.toLowerCase());
      timeCol = lower.findIndex(p => p.includes('time') || p.includes('minute'));
      targetCol = lower.findIndex(p => p.includes('target') || p.includes('temp'));
      noteCol = lower.findIndex(p => p.includes('note'));
      if(timeCol === -1) timeCol = 0;
      if(targetCol === -1) targetCol = 1;
      if(noteCol === -1) noteCol = 2;
      header = false;
      continue;
    }
    const parts = parseCSVLine(line);
    const timeMin = parseTimeToMinutes(parts[timeCol] || '0');
    const temp = parseFloat(parts[targetCol]);
    const note = parts[noteCol] ? parts[noteCol].trim() : '';
    
    if(!isNaN(timeMin) && !isNaN(temp)){
      steps.push({ time: timeMin, target: temp, note: note, spoken: false });
    }
  }
  setProfile(steps);
  console.log('[PROFILE] Loaded', steps.length, 'time steps');
}
