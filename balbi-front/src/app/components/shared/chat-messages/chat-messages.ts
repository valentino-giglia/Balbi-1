import { Component, input, output, signal, OnInit, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Observable } from 'rxjs';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { MessageContentComponent } from '../message-content/message-content';
import { ChatService, Mensaje } from '../../../services/chat.service';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    MessageContentComponent
  ],
  templateUrl: './chat-messages.html',
  styleUrl: './chat-messages.scss'
})
export class ChatMessagesComponent implements OnInit {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  
  phoneNumberId = input.required<string>();
  conversationId = input.required<string>();
  tutorPhoneNumber = input<string | undefined>(undefined);
  onMessageSent = output<void>();
  
  mensajes = signal<Mensaje[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  sending = signal(false);
  error = signal<string | null>(null);
  hasMoreMessages = signal(true);
  nextCursor = signal<string | null>(null);
  form: FormGroup;
  currentTime = signal<Date>(new Date());
  /** ID del último mensaje que llegó por webhook (para efecto "nuevo mensaje" tipo WhatsApp). */
  mensajeRecienLlegadoId = signal<string | null>(null);
  /** Muestra botón flotante para bajar a los nuevos mensajes cuando llegan y el usuario no está abajo. */
  mostrarBotonNuevosMensajes = signal(false);

  private isInitialLoad = signal(true);
  private previousScrollHeight = 0;
  private timeInterval$?: Observable<number>;
  private silentRefreshInProgress = false;

  // Computed: ventana de contexto (menos de 24 h desde el último mensaje entrante del tutor)
  contextWindowOpen = computed(() => {
    const mensajes = this.mensajes();
    if (mensajes.length === 0) return false;
    
    const inbound = mensajes.filter(m => m.direction === 'inbound');
    if (inbound.length === 0) return false;
    
    const lastInbound = inbound[inbound.length - 1];
    if (!lastInbound.timestamp) return false;
    
    const lastMessageTime = new Date(parseInt(lastInbound.timestamp) * 1000);
    const now = this.currentTime();
    const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 24;
  });

  constructor(
    private chatService: ChatService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(4096)]]
    });

    // Observable del tiempo que se actualiza cada minuto
    this.timeInterval$ = interval(60000);
    
    // Efecto para hacer scroll al final solo en la carga inicial
    effect(() => {
      if (this.mensajes().length > 0 && !this.loading() && this.isInitialLoad()) {
        setTimeout(() => {
          this.scrollToBottom();
          this.isInitialLoad.set(false);
        }, 100);
      }
    });
  }

  ngOnInit(): void {
    this.loadMensajes();
    
    // Actualizar el tiempo cada minuto para verificar la ventana de contexto
    this.timeInterval$?.subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  /** Refresca la lista de mensajes. Si silent=true, no muestra spinner y aplica efecto "nuevo mensaje" tipo WhatsApp. */
  refreshMensajes(silent = false): void {
    if (silent) {
      this.loadMensajesSilencioso();
    } else {
      this.loadMensajes();
    }
  }

  private loadMensajesSilencioso(): void {
    if (this.silentRefreshInProgress) return;

    const prevMensajes = this.mensajes();
    const prevCount = prevMensajes.length;
    const prevLastId = prevCount > 0 ? prevMensajes[prevCount - 1].id : null;
    const wasAtBottom = this.isUserAtBottom();

    this.silentRefreshInProgress = true;
    this.chatService.listarMensajes(this.phoneNumberId(), this.conversationId()).subscribe({
      next: (response) => {
        const data = response.data;
        this.mensajes.set(data);
        this.nextCursor.set(response.paging?.cursors?.after || null);
        this.hasMoreMessages.set(!!response.paging?.cursors?.after);

        const newLastId = data.length > 0 ? data[data.length - 1].id : null;
        const hayMasPorCount = data.length > prevCount;
        const hayNuevoPorId = !!newLastId && newLastId !== prevLastId;
        const hayMensajesNuevos = hayMasPorCount || hayNuevoPorId;

        if (hayMensajesNuevos && !wasAtBottom) {
          this.mostrarBotonNuevosMensajes.set(true);
        } else {
          this.scrollToBottom();
          this.mostrarBotonNuevosMensajes.set(false);
        }

        if (newLastId) {
          this.mensajeRecienLlegadoId.set(newLastId);
          setTimeout(() => this.mensajeRecienLlegadoId.set(null), 2200);
        }
        this.silentRefreshInProgress = false;
      },
      error: () => {
        this.silentRefreshInProgress = false;
      }
    });
  }

  private isUserAtBottom(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
  }

  irAbajoNuevosMensajes(): void {
    this.scrollToBottom();
    this.mostrarBotonNuevosMensajes.set(false);
  }

  loadMensajes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.isInitialLoad.set(true);

    this.chatService.listarMensajes(this.phoneNumberId(), this.conversationId()).subscribe({
      next: (response) => {
        this.mensajes.set(response.data);
        this.nextCursor.set(response.paging?.cursors?.after || null);
        this.hasMoreMessages.set(!!response.paging?.cursors?.after);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar mensajes');
        this.loading.set(false);
      }
    });
  }

  loadMoreMessages(): void {
    if (this.loadingMore() || !this.hasMoreMessages() || !this.nextCursor()) {
      return;
    }

    this.loadingMore.set(true);
    const currentScrollHeight = this.messagesContainer?.nativeElement?.scrollHeight || 0;
    this.previousScrollHeight = currentScrollHeight;

    this.chatService.listarMensajes(this.phoneNumberId(), this.conversationId(), this.nextCursor()!).subscribe({
      next: (response) => {
        const newMessages = response.data;
        if (newMessages.length > 0) {
          this.mensajes.set([...newMessages, ...this.mensajes()]);
          this.nextCursor.set(response.paging?.cursors?.after || null);
          this.hasMoreMessages.set(!!response.paging?.cursors?.after);
          
          setTimeout(() => {
            if (this.messagesContainer?.nativeElement) {
              const newScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
              const scrollDifference = newScrollHeight - this.previousScrollHeight;
              this.messagesContainer.nativeElement.scrollTop = scrollDifference;
            }
          }, 50);
        } else {
          this.hasMoreMessages.set(false);
        }
        this.loadingMore.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar más mensajes');
        this.loadingMore.set(false);
      }
    });
  }

  onScroll(): void {
    if (!this.messagesContainer?.nativeElement) return;

    const element = this.messagesContainer.nativeElement;
    const scrollTop = element.scrollTop;

    if (this.isUserAtBottom()) {
      this.mostrarBotonNuevosMensajes.set(false);
    }

    // Si está cerca del top (50px), cargar más mensajes
    if (scrollTop < 50 && this.hasMoreMessages() && !this.loadingMore()) {
      this.loadMoreMessages();
    }
  }

  enviarMensaje(): void {
    if (this.form.invalid || !this.contextWindowOpen() || !this.tutorPhoneNumber()) {
      return;
    }

    const text = this.form.get('message')?.value?.trim();
    if (!text) return;

    this.sending.set(true);
    this.error.set(null);

    const phoneNumber = this.tutorPhoneNumber()!.replace(/[\s\+-]/g, '');

    this.chatService.enviarMensaje(this.phoneNumberId(), phoneNumber, text).subscribe({
      next: () => {
        this.form.reset();
        this.sending.set(false);
        setTimeout(() => {
          this.loadMensajes();
        }, 1000);
        this.onMessageSent.emit();
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al enviar mensaje');
        this.sending.set(false);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  formatDate(timestamp?: string): string {
    if (!timestamp) return '-';
    // Si es un timestamp Unix (en segundos), convertir a milisegundos
    const timestampNum = parseInt(timestamp);
    const date = timestampNum < 10000000000 
      ? new Date(timestampNum * 1000) 
      : new Date(timestampNum);
    return date.toLocaleString('es-AR');
  }

  isSent(message: Mensaje): boolean {
    return message.direction === 'outbound';
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'done';
      case 'delivered':
        return 'done_all';
      case 'read':
        return 'done_all';
      default:
        return 'schedule';
    }
  }
}

