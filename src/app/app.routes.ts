import { Routes } from '@angular/router';
import { ReceiptComponent } from './receipt/receipt.component';
import { RecuComponent } from './recu/recu.component';

export const routes: Routes = [
    { path: '', redirectTo: '/wizall', pathMatch: 'full' }, 

    { path: 'Receipt', component: ReceiptComponent },
    { path: 'wizall', component: RecuComponent },

  // { path: 'dashboard/agent', component: AgentComponent , canActivate: [AuthGuard], data: { role: 'agent' } },
];
