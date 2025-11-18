import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { RewardsService, PointsAnimation } from '../../services/rewards.service';

@Component({
  selector: 'app-points-animation',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="points-animations-container">
      @for (animation of pointsAnimations(); track animation.id) {
        <div 
          class="points-animation"
          [style.left.px]="animation.x"
          [style.top.px]="animation.y">
          <div class="points-content">
            <ion-icon name="star" class="animation-star"></ion-icon>
            <span class="points-text">+{{ animation.points }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .points-animations-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    }

    .points-animation {
      position: absolute;
      transform: translate(-50%, -50%);
      animation: pointsFloat 2s ease-out forwards;
      pointer-events: none;
    }

    .points-content {
      display: flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 0.9rem;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .animation-star {
      font-size: 1.2rem;
      color: #fbbf24;
      filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
    }

    .points-text {
      letter-spacing: -0.5px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }

    @keyframes pointsFloat {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5) translateY(0px);
      }
      20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2) translateY(-10px);
      }
      40% {
        transform: translate(-50%, -50%) scale(1) translateY(-20px);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8) translateY(-60px);
      }
    }
  `]
})
export class PointsAnimationComponent implements OnInit {
  private rewardsService = inject(RewardsService);
  
  pointsAnimations = signal<PointsAnimation[]>([]);

  ngOnInit() {
    // React to changes in the pointsAnimations signal from the service
    effect(() => {
      this.pointsAnimations.set(this.rewardsService.pointsAnimations());
    });
  }
}