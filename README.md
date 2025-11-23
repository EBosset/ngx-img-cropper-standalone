# ImageCropperDemo

Demo Angular app showcasing a **standalone image cropper dialog** built on top of [`ngx-image-cropper`](https://www.npmjs.com/package/ngx-image-cropper).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.5.

---

## 1. Development server

### 1.1. Install dependencies

In the project folder, install npm dependencies:

```bash
npm install
```

### 1.2. Start the demo

Start the local development server (recommended):

```bash
npm start
```

or, equivalently with the Angular CLI:

```bash
ng serve
```

Then open your browser at `http://localhost:4200/`.

The home page displays:

- **A demo button** “Ajouter une image” that opens the image cropper dialog.
- **The cropped image preview** once you confirm the crop.

For the demo, it also shows the **dimensions** and an **estimated size (KB)** of the cropped image. This is only an example of how you might consume the `imageCroppedEvent` in your own components; the standalone dialog component itself does not enforce or expose any specific UI.

This page is only a shell around the real reusable component: `ImageCropperDialogComponent`.

---

## 2. Standalone image cropper dialog component

The actual reusable component lives in:

- `src/app/components/image-cropper-dialog/image-cropper-dialog.component.ts`
- `src/app/components/image-cropper-dialog/image-cropper-dialog.component.html`

Key points:

- It is declared as a **standalone component**:

  ```ts
  @Component({
    selector: 'app-image-cropper-dialog',
    standalone: true,
    imports: [...]
  })
  export class ImageCropperDialogComponent { ... }
  ```

- It is designed to be opened inside an Angular Material `MatDialog`.
- It exposes:
  - `@Output() imageCroppedEvent: EventEmitter<string>` – emits the final image as a base64 data URL.
  - `@Output() cancelEvent: EventEmitter<void>` – notifies when the user cancels.
  - Several `@Input()` properties for customization (aspect ratio, dialog title, button labels, cropper dimensions, etc.).
  - Optional compression-related inputs:
    - `compressionMaxWidth: number` (default: `800`) – maximum width of the compressed image in pixels.
    - `compressionQuality: number` (default: `0.85`) – JPEG quality factor between 0 and 1.

Image **compression and resizing** is handled by a small injectable service:

- `src/app/services/image-compression.service.ts` (`ImageCompressionService`)

This keeps the dialog focused on UI responsibilities and makes the compression logic easy to reuse or swap in more advanced setups (e.g. different max width / quality, alternative algorithms).

For example, to use a smaller avatar-friendly preset:

```html
<app-image-cropper-dialog
  [compressionMaxWidth]="512"
  [compressionQuality]="0.9">
</app-image-cropper-dialog>
```

The demo `AppComponent` simply opens this dialog and displays the resulting image.

---

## 3. Using the dialog component in another Angular application

You can reuse `ImageCropperDialogComponent` in any Angular 16+ application that uses Angular Material dialogs.

### 3.1. Prerequisites

- Angular application configured with Angular Material.
- `MatDialogModule` imported in your app.
- The `ImageCropperDialogComponent` code copied into your project (or imported from this repo if you package it as a library).

### 3.2. Minimal usage example

Example of a simple component that opens the cropper dialog and receives the cropped image:

```ts
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageCropperDialogComponent } from './components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-example',
  template: `
    <button mat-raised-button color="primary" (click)="openImageCropperDialog()">
      Ouvrir le cropper
    </button>

    <div *ngIf="croppedImage" style="margin-top: 16px;">
      <h3>Image recadrée :</h3>
      <img [src]="croppedImage" alt="Image recadrée" style="max-width: 300px;" />
    </div>
  `
})
export class ExampleComponent {
  croppedImage: string | null = null;

  constructor(private dialog: MatDialog) {}

  openImageCropperDialog(): void {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'image-cropper-dialog',
      disableClose: true
    });

    const componentInstance = dialogRef.componentInstance;

    // Image confirmed
    componentInstance.imageCroppedEvent.subscribe((base64Image: string) => {
      this.croppedImage = base64Image;
      dialogRef.close();
    });

    // Cancel
    componentInstance.cancelEvent.subscribe(() => {
      dialogRef.close();
    });
  }
}
```

This is essentially the same pattern as the internal demo `AppComponent`, extracted as a generic example.

The same example is also available as a standalone component in:

- `src/app/image-cropper-dialog-usage-example.ts`

This file is **not used** by the demo app; it is provided only as a copy-paste reference for your own components.

---

### 3.3. Saving to backend

Typically you will want to send the cropped image to your backend (API) and persist it (file storage, database, etc.).

#### Frontend (Angular) example

In your component, you can call a service when the image is confirmed:

```ts
// user-profile.component.ts
import { HttpClient } from '@angular/common/http';

export class UserProfileComponent {
  avatarBase64: string | null = null;

  constructor(private dialog: MatDialog, private http: HttpClient) {}

  openImageCropperDialog(): void {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'image-cropper-dialog',
      disableClose: true
    });

    const componentInstance = dialogRef.componentInstance;

    componentInstance.imageCroppedEvent.subscribe((base64Image: string) => {
      // 1) Update local UI
      this.avatarBase64 = base64Image;

      // 2) Optionally strip the data URL prefix
      const base64Data = base64Image.split('base64,')[1];

      // 3) Send to backend
      this.http.post('/api/users/me/avatar', { imageBase64: base64Data })
        .subscribe(() => dialogRef.close());
    });

    componentInstance.cancelEvent.subscribe(() => dialogRef.close());
  }
}
```

#### Backend pseudo-code

On the server side, you typically:

1. Receive the JSON payload `{ imageBase64: string }`.
2. Decode the base64 to binary.
3. Save the image (disk, cloud storage, etc.).
4. Store the file path / URL in your database.

Example pseudo-code in a Node/Express-style controller:

```ts
// Pseudo-code (server side)
app.post('/api/users/me/avatar', async (req, res) => {
  const { imageBase64 } = req.body; // string without data URL prefix

  // Decode base64 to binary buffer
  const buffer = Buffer.from(imageBase64, 'base64');

  // Save the file (example: local disk, but could be S3, etc.)
  const filePath = `/uploads/avatars/user-123.png`;
  await fs.promises.writeFile(filePath, buffer);

  // Update database with the file path or URL
  await userRepository.updateAvatarUrl('user-123', filePath);

  res.status(200).json({ success: true, url: filePath });
});
```

You can adapt this pattern to any backend technology (Java, .NET, PHP, Python, etc.): the main idea is always **decode base64 → save file → store reference (URL/path) in your database**.

---

## 4. Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## 5. Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## 6. Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## 7. Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 8. Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## 9. Customizing colors

The demo and the image cropper dialog use a small set of CSS variables defined in `src/styles.css`:

```css
:root {
  --primary: #9AA32F;
  --primary-light: #C9D590;
  --accent: #CDEB47;
  --text-dark: #30250A;
  --background-light: #E9EED4;
  --background-field: #E9EED4;
  --surface: #FFFFFF;
  --editor-bg: #444444;
  --editor-text: #FFFFFF;
}
```

Most button and cropper colors are derived from these variables.

### 9.1. Changing the theme colors

To change the global theme (for example from green to blue), update the variables above in your own `styles.css`:

```css
:root {
  --primary: #1976d2;        /* main color (buttons, highlights) */
  --primary-light: #63a4ff;  /* secondary button background */
  --accent: #ffeb3b;         /* hover / accent color */
  --text-dark: #1f2933;
  --background-light: #f5f7fa;
  --background-field: #eef2f7;
}
```

All elements using `.btn-primary`, `.btn-secondary`, `.slider`, and the cropper overlay will automatically use the new colors.

### 9.2. Overriding button styles

If you prefer, you can override the button classes directly (still in `styles.css`):

```css
.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-secondary {
  background-color: #e0e7ff;
  color: #1f2933;
}
```

### 9.3. Angular Material buttons

The demo also customizes Angular Material buttons using the same variables:

```css
.mat-mdc-raised-button.mat-primary {
  --mdc-protected-button-container-color: var(--primary);
  --mdc-protected-button-label-text-color: white;
}

.mat-mdc-raised-button.mat-primary:hover {
  --mdc-protected-button-container-color: var(--accent);
}
```

Updating `--primary` and `--accent` is usually enough to align Material buttons with your brand colors.
