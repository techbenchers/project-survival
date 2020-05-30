import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Question {
  id: number;
  question: string;
  answered: number;
}

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.css']
})
export class QuestionListComponent implements OnInit {

  questions: Question[] = [];

  constructor(private router: Router, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.http.get('https://survival.pythonanywhere.com/question').subscribe((questions: Question[]) => {
      this.questions = [...questions].reverse();
    });
  }

  optionClicked(quest: Question) {
    this.router.navigate([`/question/${quest.id}`]);
  }

  trimQuestion(text: string): string {
    return text.split(' ').slice(0, 20).join(' ') + '...';
  }

}
