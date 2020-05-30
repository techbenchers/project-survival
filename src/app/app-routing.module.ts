import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {QuestionListComponent} from './question-list/question-list.component';
import {QuestionAddComponent} from './question-add/question-add.component';
import {QuestionAnswerComponent} from './question-answer/question-answer.component';


const routes: Routes = [
  {
    path: '',
    component: QuestionListComponent
  },
  {
    path: 'add',
    component: QuestionAddComponent
  },
  {
    path: 'question/:id',
    component: QuestionAnswerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
