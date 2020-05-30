import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Question } from '../question-list/question-list.component';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { Answer } from '../question-add/question-add.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-question-answer',
  templateUrl: './question-answer.component.html',
  styleUrls: ['./question-answer.component.css']
})
export class QuestionAnswerComponent implements OnInit {

  questionId: string;
  answers: Answer[];
  question: Question;
  answerTxt: string;
  files: File[];
  fileReader: FileReader;
  fileLinks = '';

  headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  imageHeader = new HttpHeaders({
    Authorization: `Client-ID ${environment.clientId}`
  });

  @ViewChild('answerDialog', { static: true }) answerDialog: TemplateRef<any>;
  @ViewChild('form') form: NgForm;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private dialog: MatDialog) {
  }

  splitComma(text: string) {
    return text.split(',');
  }

  openAnswerDialog() {
    this.dialog.open(this.answerDialog);
  }

  isImage(text: string) {
    return text.includes('https://i.imgur.com');
  }

  onFileChange(ev: any) {
    if (ev.target.files && ev.target.files.length > 0) {
      this.files = [...ev.target.files];
      this.read(this.files, 0);
    }
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

  async read(files: File[], i: number) {
    if (i >= files.length) {
      return;
    }
    const text: string = await this.readFile(files[i]);
    this.uploadImage(text);
    this.read(files, i + 1);
  }

  formSubmit() {
    this.uploadAnswer();
    this.submitImage();
  }

  submitImage() {
    if (this.fileLinks === '') return;
    const answer: Answer = {
      questionid: this.question.id,
      answer: this.fileLinks.substr(0, this.fileLinks.length - 1)
    };
    this.http.post<Answer>(`https://survival.pythonanywhere.com/answer`,
      { questionid: answer.questionid, answer: answer.answer }, { headers: this.headers }).subscribe(
        (ans: Answer) => {
          this.getAnswers();
          this.dialog.closeAll();
        },
        (err: any) => {
          console.error(err);
        });
  }

  uploadAnswer() {
    if (!this.answerTxt || this.answerTxt === '') {
      return;
    }
    const answer: Answer = {
      questionid: this.question.id,
      answer: this.answerTxt
    };
    this.http.post<Answer>(`https://survival.pythonanywhere.com/answer`,
      { questionid: answer.questionid, answer: answer.answer }, { headers: this.headers }).subscribe(
        (ans: Answer) => {
          this.getAnswers();
          this.dialog.closeAll();
        },
        (err: any) => {
          console.error(err);
        });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.questionId = params.id;
      this.getQuestions();
      this.getAnswers();
    });
  }

  getQuestions() {
    this.http.get(`https://survival.pythonanywhere.com/question/${this.questionId}`).subscribe((quest: Question) => {
      this.question = quest;
    });
  }

  getAnswers() {
    this.http.get(`https://survival.pythonanywhere.com/answer/${this.questionId}`).subscribe((answers: Answer[]) => {
      this.answers = [...answers];
    });
  }

}
