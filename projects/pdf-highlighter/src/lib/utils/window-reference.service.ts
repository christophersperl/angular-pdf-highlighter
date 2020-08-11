import { Injectable } from '@angular/core';

function _window(): any {
  return window;
}

// https://juristr.com/blog/2016/09/ng2-get-window-ref/#register-windowref-as-provider
@Injectable({
  providedIn: 'root'
})
export class WindowReferenceService {
  get nativeWindow(): any {
    return _window();
  }
}
