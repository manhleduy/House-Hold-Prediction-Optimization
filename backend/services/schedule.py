from itertools import count
import heapq


from itertools import count
import heapq


class OptimizeEnv:

    def __init__(
        self,
        appliances,
        timeline,
        max_load
    ):
        self.appliances = appliances
        self.timeline = timeline
        self.max_load = max_load
        self.T = len(timeline)

    # =====================================
    # ENERGY COST
    # =====================================

    def compute_incremental_energy(
        self,
        app,
        start
    ):
        return sum(
            app.power *
            self.timeline[t].electric_price
            for t in range(
                start,
                start + app.duration
            )
        )

    # =====================================
    # COMFORT COST
    # =====================================

    def comfort_penalty(
        self,
        app,
        start
    ):
        if (
            app.preferred_start
            <= start
            <= app.preferred_end
        ):
            return 0

        return abs(
            start - app.preferred_start
        ) * 20

    # =====================================
    # HARD CONSTRAINT
    # =====================================

    def is_valid_power(
        self,
        timeline_load,
        app,
        start
    ):

        if start < 0:
            return False

        if start + app.duration > self.T:
            return False

        for t in range(
            start,
            start + app.duration
        ):

            if (
                timeline_load[t]
                + app.power
                > self.max_load
            ):
                return False

        return True

    # =====================================
    # APPLY LOAD
    # =====================================

    def apply(
        self,
        timeline_load,
        app,
        start
    ):
        for t in range(
            start,
            start + app.duration
        ):
            timeline_load[t] += app.power

    # =====================================
    # A* HEURISTIC
    # =====================================

    def heuristic(
        self,
        index,
        appliances
    ):

        remaining = appliances[index:]

        min_price = min(
            s.electric_price
            for s in self.timeline
        )

        return sum(
            app.power
            * app.duration
            * min_price
            for app in remaining
        )

    # =====================================
    # REPAIR SLOT
    # =====================================

    def find_nearest_valid_slot(
        self,
        timeline_load,
        app,
        target_start
    ):

        if self.is_valid_power(
            timeline_load,
            app,
            target_start
        ):
            return target_start

        candidates = []

        max_shift = self.T

        for shift in range(
            1,
            max_shift
        ):

            left = target_start - shift
            right = target_start + shift

            # LEFT
            if left >= 0:

                if self.is_valid_power(
                    timeline_load,
                    app,
                    left
                ):

                    energy = (
                        self.compute_incremental_energy(
                            app,
                            left
                        )
                    )

                    candidates.append(
                        (
                            shift,
                            energy,
                            left
                        )
                    )

            # RIGHT
            if (
                right
                <= self.T - app.duration
            ):

                if self.is_valid_power(
                    timeline_load,
                    app,
                    right
                ):

                    energy = (
                        self.compute_incremental_energy(
                            app,
                            right
                        )
                    )

                    candidates.append(
                        (
                            shift,
                            energy,
                            right
                        )
                    )

            # tìm được khoảng cách gần nhất
            if candidates:
                break

        if not candidates:
            return None

        candidates.sort(
            key=lambda x: (
                x[0],  # gần nhất
                x[1]   # điện rẻ hơn
            )
        )

        return candidates[0][2]

    # =====================================
    # SLOT GENERATION
    # =====================================

    def get_candidate_slots(
        self,
        timeline_load,
        app,
        k=5
    ):

        candidates = []

        visited = set()

        for start in range(
            app.preferred_start,
            app.preferred_end + 1
        ):

            valid_start = (
                self.find_nearest_valid_slot(
                    timeline_load,
                    app,
                    start
                )
            )

            if valid_start is None:
                continue

            if valid_start in visited:
                continue

            visited.add(valid_start)

            energy = (
                self.compute_incremental_energy(
                    app,
                    valid_start
                )
            )

            comfort = (
                self.comfort_penalty(
                    app,
                    valid_start
                )
            )

            score = energy + comfort

            candidates.append(
                (
                    score,
                    valid_start
                )
            )

        candidates.sort(
            key=lambda x: x[0]
        )

        return [
            start
            for _, start
            in candidates[:k]
        ]

    # =====================================
    # A*
    # =====================================

    def astar(self):
        
        appliances = sorted(
            self.appliances,
            key=lambda x: x.power,
            reverse=True
        )

        base_load = [
            s.base_load
            for s in self.timeline
        ]

        pq = []

        counter = count()

        heapq.heappush(
            pq,
            (
                0,
                0,
                next(counter),
                0,
                {},
                base_load
            )
        )

        best_cost = float("inf")
        best_schedule = None

        while pq:

            (
                f,
                g,
                _,
                index,
                schedule,
                timeline_load
            ) = heapq.heappop(pq)

            if index == len(appliances):

                if g < best_cost:

                    best_cost = g
                    best_schedule = schedule

                continue

            app = appliances[index]

            candidate_slots = (
                self.get_candidate_slots(
                    timeline_load,
                    app,
                    k=5
                )
            )

            for start in candidate_slots:

                new_schedule = schedule.copy()

                new_schedule[
                    app.id
                ] = start

                new_load = (
                    timeline_load.copy()
                )

                self.apply(
                    new_load,
                    app,
                    start
                )

                energy = (
                    self.compute_incremental_energy(
                        app,
                        start
                    )
                )

                comfort = (
                    self.comfort_penalty(
                        app,
                        start
                    )
                )

                new_g = (
                    g
                    + energy
                    + comfort
                )

                if (
                    new_g
                    >= best_cost
                ):
                    continue

                h = self.heuristic(
                    index + 1,
                    appliances
                )

                new_f = new_g + h

                heapq.heappush(
                    pq,
                    (
                        new_f,
                        new_g,
                        next(counter),
                        index + 1,
                        new_schedule,
                        new_load
                    )
                )

        optimize_load = [
            s.base_load
            for s in self.timeline
        ]

        if best_schedule:

            for app in self.appliances:

                start = best_schedule[
                    app.id
                ]

                for t in range(
                    start,
                    start + app.duration
                ):
                    optimize_load[t] += app.power
        
        return (
            best_schedule,
            best_cost,
            optimize_load
        )