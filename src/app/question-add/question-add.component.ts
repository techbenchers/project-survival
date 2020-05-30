import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Question } from '../question-list/question-list.component';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Answer {
  questionid: number;
  answer: string;
  id?: number;
}

@Component({
  selector: 'app-question-add',
  templateUrl: './question-add.component.html',
  styleUrls: ['./question-add.component.css']
})
export class QuestionAddComponent implements OnInit {

  question: string;
  answer: string;
  files: File[] = [];
  fileReader: FileReader;
  images: string[] = [];
  fileLinks = '';

  headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  imageHeader = new HttpHeaders({
    Authorization: `Client-ID ${environment.clientId}`
  });


  @ViewChild('form') form: NgForm;
  @ViewChild('submittedSuccessfully', { static: true }) submittedSuccessfully: TemplateRef<any>;

  constructor(private http: HttpClient,
    private router: Router,
    private dialog: MatDialog) {
  }

  ngOnInit(): void {
  }

  trimBase64Image(image: string) {
    return image.substr(image.indexOf(',') + 1);
  }

  uploadImage(image: string) {
    image = this.trimBase64Image(image);
    this.http.post(`https://api.imgur.com/3/image`, { image, type: 'image/jpeg' }, { headers: this.imageHeader }).subscribe((d: any) => {
      const link: string = d?.data?.link;
      this.fileLinks += link + ',';
    });
  }

  readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      this.fileReader = new FileReader();
      this.fileReader.onload = () => {
        res(this.fileReader.result as string);
      };
      this.fileReader.readAsDataURL(file);
    });
  }

  onFileChange(ev: any) {
    if (ev.target.files && ev.target.files.length > 0) {
      this.files = [...ev.target.files];
      this.read(this.files, 0);
    }
  }

  submitImage(questionId: number) {
    if (this.fileLinks === '') return;
    const answer: Answer = {
      questionid: questionId,
      answer: this.fileLinks.substr(0, this.fileLinks.length - 1)
    };
    this.http.post<Answer>(`https://survival.pythonanywhere.com/answer`,
      { questionid: answer.questionid, answer: answer.answer }, { headers: this.headers }).subscribe(
        (ans: Answer) => {
          this.router.navigate(['/']);
        },
        (err: any) => {
          console.error(err);
        });
  }

  async read(files: File[], i: number) {
    if (i >= files.length) {
      return;
    }
    const text: string = await this.readFile(files[i]);
    this.uploadImage(text);
    this.read(files, i + 1);
  }

  formSubmit() {
    if (this.form.status === 'VALID') {
      this.uploadQuestion();
    }
  }

  uploadQuestion() {
    this.http.post<Question>(`https://survival.pythonanywhere.com/question`, { question: this.question }, { headers: this.headers })
      .subscribe((data: Question) => {
        this.submitImage(data.id);
        this.uploadAnswer(data.id).subscribe((d: number) => {
          if (d === 0) {
            if (confirm('Question & Answer added successfully'))
              this.routeBack();
          }
          else {
            if (confirm('Question added successfully'))
              this.routeBack();
          }
        }, (err: any) => {
          console.error(err);
        })
      }, (err: any) => {
        if (err.status === 409) {
          let questionId: number = parseInt(err.error.duplicateQuestionid);
          this.uploadAnswer(questionId).subscribe((d: number) => {
            if (confirm('Question & Answer added successfully'))
              this.routeBack();
          }, (err: any) => {
            console.error(err);
            this.routeBack();
          })
        }
      });
  }

  routeBack() {
    this.router.navigate(['/']);
  }

  uploadAnswer(questionId: number): Observable<number> {
    if (!this.answer || this.answer === '') return Observable.create((o: any) => o.next(1))
    const answer: Answer = {
      questionid: questionId,
      answer: this.answer
    };
    return this.http.post<Answer>(`https://survival.pythonanywhere.com/answer`,
      { questionid: answer.questionid, answer: answer.answer }, { headers: this.headers }).pipe(map((a: any) => 0));

  }

}
