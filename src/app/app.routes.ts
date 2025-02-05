import { Routes } from '@angular/router';
import { ReceiptComponent } from './receipt/receipt.component';

export const routes: Routes = [
    { path: '', redirectTo: '/Receipt', pathMatch: 'full' }, 

    { path: 'Receipt', component: ReceiptComponent },

  // { path: 'dashboard/agent', component: AgentComponent , canActivate: [AuthGuard], data: { role: 'agent' } },
];
