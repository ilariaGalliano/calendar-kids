import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonBadge } from '@ionic/angular/standalone';
import { RewardsService } from '../../services/rewards.service';
import { Child } from '../../models/family.models';

@Component({
  selector: 'app-child-rewards',
  standalone: true,
  imports: [CommonModule, IonIcon, IonBadge],
  template: `
    <div class="child-rewards">
      <div class="rewards-header">
        <div class="child-info">
          <span class="child-avatar">{{ child.avatar }}</span>
          <span class="child-name">{{ child.name }}</span>
        </div>
        <div class="points-display">
          <ion-icon name="star" class="star-icon"></ion-icon>
          <span class="points-text">{{ childPoints()?.totalPoints || 0 }}</span>
        </div>
      </div>
      
      <div class="stars-progress">
        <div class="stars-earned">
          @for (star of starsArray(); track $index) {
            <ion-icon name="star" class="earned-star"></ion-icon>
          }
          @if (hasPartialProgress()) {
            <div class="partial-star">
              <ion-icon name="star-outline" class="empty-star"></ion-icon>
              <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
            </div>
          }
        </div>
        
        <div class="progress-text">
          @if (pointsToNext() > 0) {
            <span>{{ pointsToNext() }} punti alla prossima ⭐</span>
          } @else {
            <span>Stella completa! 🌟</span>
          }
        </div>
      </div>
      
      @if (childPoints()?.dailyPoints) {
        <ion-badge color="success" class="daily-badge">
          Oggi: +{{ childPoints()?.dailyPoints }}
        </ion-badge>
      }
    </div>
  `,
  styles: [`
    .child-rewards {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid rgba(226, 232, 240, 0.6);
    }

    .rewards-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .child-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .child-avatar {
      font-size: 1.5rem;
    }

    .child-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 1rem;
    }

    .points-display {
      display: flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 6px 10px;
      border-radius: 20px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    }

    .star-icon {
      font-size: 1.1rem;
      color: #fbbf24;
    }

    .points-text {
      font-size: 0.9rem;
      letter-spacing: -0.5px;
    }

    .stars-progress {
      margin-bottom: 8px;
    }

    .stars-earned {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-bottom: 6px;
      min-height: 24px;
    }

    .earned-star {
      font-size: 1.3rem;
      color: #f59e0b;
      filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4));
    }

    .partial-star {
      position: relative;
      display: inline-block;
    }

    .empty-star {
      font-size: 1.3rem;
      color: #e2e8f0;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
      border-radius: 50%;
      overflow: hidden;
      mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-15 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z"/></svg>') no-repeat center;
      mask-size: contain;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .daily-badge {
      font-size: 0.7rem;
      font-weight: 600;
      --padding-start: 8px;
      --padding-end: 8px;
    }
  `]
})
export class ChildRewardsComponent {
  @Input() child!: Child;
  
  private rewardsService = inject(RewardsService);
  
  childPoints = computed(() => 
    this.rewardsService.getPointsForChild(this.child.id)
  );
  
  starsEarned = computed(() => 
    this.rewardsService.getStarsForPoints(this.childPoints()?.totalPoints || 0)
  );
  
  starsArray = computed(() => 
    Array(this.starsEarned()).fill(0)
  );
  
  pointsToNext = computed(() => 
    this.rewardsService.getPointsToNextStar(this.childPoints()?.totalPoints || 0)
  );
  
  hasPartialProgress = computed(() => 
    (this.childPoints()?.totalPoints || 0) % 50 > 0
  );
  
  progressPercentage = computed(() => 
    ((this.childPoints()?.totalPoints || 0) % 50) * 2
  );
}