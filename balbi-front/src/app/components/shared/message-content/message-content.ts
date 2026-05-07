import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MessageType } from '../../../services/chat.service';

@Component({
  selector: 'app-message-content',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './message-content.html',
  styleUrl: './message-content.scss'
})
export class MessageContentComponent {
  type = input.required<MessageType>();
  text = input<string | null | undefined>(null);
  imageUrl = input<string | null | undefined>(null);
  audioUrl = input<string | null | undefined>(null);
  videoUrl = input<string | null | undefined>(null);
  documentUrl = input<string | null | undefined>(null);
  transcript = input<string | null | undefined>(null);
}

