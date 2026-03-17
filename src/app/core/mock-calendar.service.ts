import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MockCalendarService {
  // Simulate demo data for calendar views
  getNowCalendar() {
    return Promise.resolve({
      date: new Date().toISOString().slice(0, 10),
      tasks: [
        { id: 1, title: 'Mock Task 1', child: 'Alice', childId: 'kid1', childName: 'Alice', completed: false },
        { id: 2, title: 'Mock Task 2', child: 'Marco', childId: 'kid2', childName: 'Bob', completed: true },
      ],
    });
  }

  getDayCalendar(date: string) {
    return Promise.resolve({
      date,
      tasks: [
        { id: 3, title: 'Day Task 1', child: 'Alice', childId: 'kid1', childName: 'Alice', completed: false },
        { id: 4, title: 'Day Task 2', child: 'Bob', childId: 'kid2', childName: 'Bob', completed: false },
      ],
    });
  }

  getWeekCalendar(startDate: string) {
    // Simulate a week of tasks
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    return Promise.resolve({
      week: days,
      tasks: days.map((date, idx) => ({
        id: 10 + idx,
        title: `Week Task ${idx + 1}`,
        child: idx % 2 === 0 ? 'Alice' : 'Bob',
        childId: idx % 2 === 0 ? 'kid1' : 'kid2',
        childName: idx % 2 === 0 ? 'Alice' : 'Bob',
        completed: idx % 3 === 0,
        date,
      })),
    });
  }
}
