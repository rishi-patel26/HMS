import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/enums/role.enum';

/**
 * Structural directive that shows/hides elements based on user role
 * 
 * Usage:
 * <button *appHasRole="[Role.ADMIN]" (click)="delete()">Delete</button>
 * <div *appHasRole="[Role.ADMIN, Role.FRONTDESK]">Content</div>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole: Role[] = [];

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const userRole = this.authService.getUserRole();
    
    if (userRole && this.appHasRole.includes(userRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
