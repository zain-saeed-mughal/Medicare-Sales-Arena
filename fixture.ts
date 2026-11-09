export const teams = ['Vanguard','Apex','Velocity','Summit'];
export const agents = ['Jordan Hayes','Maya Brooks','Ethan Cole','Avery Chen','Sofia Reyes','Noah Bennett','Amara Davis','Liam Parker','Zoe Morgan','Owen Blake'].map((name,i)=>({id:i,name,team:teams[[0,1,2,0,3,1,2,0,3,1][i]],sales:[24,22,20,18,16,14,12,10,9,7][i]}));
export function rank(list:typeof agents){return [...list].sort((a,b)=>b.sales-a.sales || a.id-b.id)}
export function nextApproval(sequence:number){return [2,2,2,1,4,0,3,5][sequence%8]}
