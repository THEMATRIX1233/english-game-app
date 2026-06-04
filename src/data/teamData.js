import { teamArtists } from './teamPlaylist'

export const artists = teamArtists

export function getRandomArtist() {
  return teamArtists[Math.floor(Math.random() * teamArtists.length)]
}

const grammarQuestions = [
  {
    id: 'g1',
    type: 'present-simple',
    title: '📝 Present Simple',
    question: 'Choose the correct form for present simple:',
    prompt: 'Rammstein ___ from Germany.',
    options: ['come', 'comes', 'is coming', 'came'],
    correctIndex: 1,
    explanation: 'Present simple for facts. "Comes" is correct because Rammstein is a singular band name.',
  },
  {
    id: 'g2',
    type: 'present-simple',
    title: '📝 Present Simple',
    question: 'Choose the correct form for present simple:',
    prompt: 'Harry Styles ___ a British singer.',
    options: ['am', 'is', 'are', 'be'],
    correctIndex: 1,
    explanation: 'Present simple for facts. "Is" is correct with third person singular.',
  },
  {
    id: 'g3',
    type: 'present-simple',
    title: '📝 Present Simple',
    question: 'Choose the correct form for present simple:',
    prompt: 'Cazzu ___ in Spanish.',
    options: ['sing', 'sings', 'is singing', 'sang'],
    correctIndex: 1,
    explanation: 'Present simple for general truths. "Sings" is correct for third person.',
  },
  {
    id: 'g4',
    type: 'present-simple',
    title: '📝 Present Simple',
    question: 'Choose the correct form for present simple:',
    prompt: 'Bunbury ___ rock music.',
    options: ['play', 'plays', 'is playing', 'played'],
    correctIndex: 1,
    explanation: 'Present simple for general truths. "Plays" is correct.',
  },
  {
    id: 'g5',
    type: 'present-simple',
    title: '📝 Present Simple',
    question: 'Choose the correct form for present simple:',
    prompt: 'Joji ___ from Japan.',
    options: ['come', 'comes', 'is coming', 'came'],
    correctIndex: 1,
    explanation: 'Present simple for facts. "Comes" is correct.',
  },
  {
    id: 'g6',
    type: 'past-simple',
    title: '📝 Past Simple',
    question: 'Choose the correct form in past simple:',
    prompt: 'Last year, I ___ Rammstein in concert.',
    options: ['see', 'saw', 'have seen', 'am seeing'],
    correctIndex: 1,
    explanation: 'Past simple for completed actions. "Saw" is the past of "see".',
  },
  {
    id: 'g7',
    type: 'past-simple',
    title: '📝 Past Simple',
    question: 'Choose the correct form in past simple:',
    prompt: 'Yesterday, my friend ___ to a Harry Styles concert.',
    options: ['go', 'goes', 'went', 'has gone'],
    correctIndex: 2,
    explanation: 'Past simple for completed actions. "Went" is the past of "go".',
  },
  {
    id: 'g8',
    type: 'past-simple',
    title: '📝 Past Simple',
    question: 'Choose the correct form in past simple:',
    prompt: 'Last month, we ___ Cazzu live.',
    options: ['hear', 'hears', 'heard', 'have heard'],
    correctIndex: 2,
    explanation: 'Past simple for completed actions. "Heard" is the past of "hear".',
  },
  {
    id: 'g9',
    type: 'past-simple',
    title: '📝 Past Simple',
    question: 'Choose the correct form in past simple:',
    prompt: 'She ___ Bunbury tickets last week.',
    options: ['buys', 'is buying', 'bought', 'has bought'],
    correctIndex: 2,
    explanation: 'Past simple for completed actions. "Bought" is the past of "buy".',
  },
  {
    id: 'g10',
    type: 'past-simple',
    title: '📝 Past Simple',
    question: 'Choose the correct form in past simple:',
    prompt: 'I ___ to Joji\'s concert last Friday.',
    options: ['go', 'goes', 'went', 'have gone'],
    correctIndex: 2,
    explanation: 'Past simple for completed actions. "Went" is the past of "go".',
  },
  {
    id: 'g11',
    type: 'present-continuous',
    title: '📝 Present Continuous',
    question: 'Choose the correct form in present continuous:',
    prompt: 'Right now, Rammstein ___ a concert in Berlin.',
    options: ['plays', 'is playing', 'played', 'has played'],
    correctIndex: 1,
    explanation: 'Present continuous for actions happening right now.',
  },
  {
    id: 'g12',
    type: 'present-continuous',
    title: '📝 Present Continuous',
    question: 'Choose the correct form in present continuous:',
    prompt: 'Look! Harry Styles ___ autographs for fans.',
    options: ['signs', 'is signing', 'signed', 'has signed'],
    correctIndex: 1,
    explanation: 'Present continuous for actions happening at the moment.',
  },
  {
    id: 'g13',
    type: 'present-continuous',
    title: '📝 Present Continuous',
    question: 'Choose the correct form in present continuous:',
    prompt: 'Cazzu ___ a new album this year.',
    options: ['records', 'is recording', 'recorded', 'has recorded'],
    correctIndex: 1,
    explanation: 'Present continuous for temporary actions happening around now.',
  },
  {
    id: 'g14',
    type: 'present-continuous',
    title: '📝 Present Continuous',
    question: 'Choose the correct form in present continuous:',
    prompt: 'Bunbury ___ on stage at this moment.',
    options: ['performs', 'is performing', 'performed', 'has performed'],
    correctIndex: 1,
    explanation: 'Present continuous for actions in progress right now.',
  },
  {
    id: 'g15',
    type: 'present-continuous',
    title: '📝 Present Continuous',
    question: 'Choose the correct form in present continuous:',
    prompt: 'Junior H ___ a new song right now.',
    options: ['sings', 'is singing', 'sang', 'has sung'],
    correctIndex: 1,
    explanation: 'Present continuous for actions happening at this moment.',
  },
]

export function getRandomQuestion() {
  return grammarQuestions[Math.floor(Math.random() * grammarQuestions.length)]
}

export function getQuestionsByType(type) {
  return grammarQuestions.filter(q => q.type === type)
}

export function getAllQuestions() {
  return [...grammarQuestions]
}
