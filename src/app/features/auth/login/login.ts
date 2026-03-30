import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // tracks UI state so the template can react
  loading = signal(false);
  errorMessage = signal('');

  // the reactive form: two controls, both required
  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit() {
    // if fields are empty/invalid, mark them and stop
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    // getRawValue() gives us a typed {username, password}
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        // success: token came back from your backend
        console.log('Logged in! Token:', response.accessToken);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // failure: wrong credentials, server down, or CORS
        this.loading.set(false);
        this.errorMessage.set('Login failed. Check your credentials.');
        console.error('Login error:', err);
      },
    });
  }
}
