import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/api/admin/questions/some-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: "e1",
    text: "test",
    options: [{id:"o1", text:"1", isCorrect:true, optionKey:"A"}, {id:"o2", text:"2", isCorrect:false, optionKey:"B"}, {id:"o3", text:"3", isCorrect:false, optionKey:"C"}, {id:"o4", text:"4", isCorrect:false, optionKey:"D"}],
    difficulty: "Easy",
    topic: "Test"
  })
});
const data = await res.json();
console.log(data);
