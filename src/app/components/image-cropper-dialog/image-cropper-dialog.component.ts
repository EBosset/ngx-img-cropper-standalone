import { Component, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Output, Input, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { ImageCompressionService } from '../../services/image-compression.service';

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    ImageCropperComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ImageCropperDialogComponent {
  @Output() imageCroppedEvent = new EventEmitter<string>();
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() error = new EventEmitter<string | Error>();
  @Output() imageCroppedInfoEvent = new EventEmitter<{
    base64: string;
    width: number;
    height: number;
    sizeKb: number;
  }>();
  
  @Input() aspectRatio: number = 4/3;
  @Input() cropperWidth: number = 400;
  @Input() cropperHeight: number = 300;
  @Input() dialogTitle: string = "Recadrer l'image";
  @Input() confirmButtonText: string = "Confirmer";
  @Input() cancelButtonText: string = "Annuler";
  @Input() overlayColor: string = "rgba(0,0,0,0.7)";
  @Input() compressionMaxWidth: number = 800;
  @Input() compressionQuality: number = 0.85;
  
  imageChangedEvent: Event | null = null;
  croppedImage: SafeUrl = '';
  rawBase64Image: string = ''; 
  fileName: string = '';
  errorMessage: string | null = null;
  
  canvasRotation = 0;
  rotation = 0;
  scale = 1;
  transform: ImageTransform = {};
  
  imageScale = 1;
  
  private readonly MAX_ZOOM = 3;
  private readonly MIN_ZOOM = 0.5;
  
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private imageCompression: ImageCompressionService,
  ) {}

  fileChangeEvent(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.resetImageTransformValues();
    this.imageChangedEvent = event;
    if (input?.files?.length) {
      this.fileName = input.files[0].name;
    }
  }
  
  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }
  
  async imageCropped(event: ImageCroppedEvent): Promise<void> {
    if (event.blob) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target.result;

        try {
          const compressedImage = await this.imageCompression.compressImage(
            base64,
            this.compressionMaxWidth,
            this.compressionQuality,
          );

          this.rawBase64Image = compressedImage.base64;
          this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(compressedImage.base64);
          this.errorMessage = null;

          const base64Data = this.rawBase64Image.includes('base64,')
            ? this.rawBase64Image.split('base64,')[1]
            : this.rawBase64Image;

          const length = base64Data.length;
          const bytes = Math.ceil((length * 3) / 4);
          const sizeKb = Math.round(bytes / 1024);

          this.imageCroppedInfoEvent.emit({
            base64: this.rawBase64Image,
            width: compressedImage.width,
            height: compressedImage.height,
            sizeKb,
          });

          // Forcer la détection de changements avec OnPush
          this.cdr.markForCheck();
        } catch (error) {
          console.error('Erreur lors de la compression:', error);
          this.errorMessage = "Une erreur est survenue lors de la compression de l'image.";
          this.error.emit(error instanceof Error ? error : String(error));
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(event.blob);
    }
  }
  
  imageLoaded(): void {}
  
  cropperReady(): void {}
  
  loadImageFailed(): void {
    console.error("L'image n'a pas pu être chargée");
    this.errorMessage = "L'image n'a pas pu être chargée. Veuillez essayer avec un autre fichier.";
    this.error.emit("LOAD_IMAGE_FAILED");
    this.cdr.markForCheck();
  }
  
  updateImageScale(): void {
    this.scale = this.imageScale;
    this.updateImageTransform();
  }
  
  rotateLeft(): void {
    this.canvasRotation--;
    this.flipAfterRotate();
  }
  
  rotateRight(): void {
    this.canvasRotation++;
    this.flipAfterRotate();
  }
  
  resetImage(): void {
    this.resetImageTransformValues();
    this.imageScale = 1;
    this.updateImageTransform();
  }
  
  updateImageTransform(): void {
    this.transform = {
      ...this.transform,
      scale: this.scale,
      rotate: this.rotation
    };
  }
  
  resetImageTransformValues(): void {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {};
    this.imageScale = 1;
  }
  
  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
  }
  
  /**
   * Retourne l'image recadrée en format base64 sans le préfixe
   * Utile pour l'envoyer à une API ou la stocker en base de données
   */
  getBase64WithoutPrefix(): string {
    if (!this.rawBase64Image) return '';

    return this.rawBase64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
  }
  
  closeDialog(): void {
    this.cancelEvent.emit();
  }
  
  confirmCrop(): void {
    if (this.rawBase64Image) {
      this.imageCroppedEvent.emit(this.rawBase64Image);
    }
  }
}

