// App metadata and verified publication URLs only. No diary records or student data.
export const apps = [
  {id:'timer', title:'쉬는시간 타이머',description:'잠깐 쉬고, 다시 즐겁게 시작해요. 교실 화면에 크게 띄우는 우리 반 타이머.',category:'classroom',tags:['교실 도구','새로 만들었어요'],icon:'timer',color:'green',url:'#timer',featured:true},
  {id:'aac', title:'마음말',description:'그림 카드를 누르고 한국어 음성으로 마음을 전하는 보완대체의사소통 도구.',category:'learning',tags:['의사소통','그림 · 음성'],icon:'message',color:'peach',url:'https://maeum-aac-260917.rb7bx889jt.chatgpt.site'},
  {id:'escape', title:'알라르간도',description:'사라진 마지막 악보를 찾아서. 10개의 단서를 푸는 영상 기억 방탈출 게임.',category:'play',tags:['기억력','초등 4–6학년'],icon:'music',color:'purple',url:'https://allargando-memory-escape.rb7bx889jt.chatgpt.site'},
  {id:'check', title:'레피숭이의 경경화 체크',description:'일과 쉼 사이, 10개의 질문으로 가볍게 즐기는 레피숭이의 재미 테스트.',category:'play',tags:['재미 테스트','10문항'],icon:'spark',color:'yellow',url:'https://gyeonggyeong-check.rb7bx889jt.chatgpt.site'},
  {id:'diary', title:'하루의 조각',description:'Google 계정으로 로그인하고, 여러 기기에서 나만의 일기를 이어 써요.',category:'personal',tags:['개인 일기장','Google 로그인'],icon:'book',color:'blue',url:'./diary/'},
  {id:'diary-local', title:'하루의 조각 · 로컬',description:'이전에 이 컴퓨터에 저장한 일기장을 열어요. 기존 기록은 그대로 보관돼요.',category:'personal',tags:['기존 일기장','내 컴퓨터 전용'],icon:'book',color:'blue',url:'http://127.0.0.1:8765',local:true}
];
