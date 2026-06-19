class Appliance:
    def __init__(self, id, name, power, duration, preferred_start=1 , preferred_end=144):
        self.id = id
        self.name = name
        self.power = power              # W
        self.duration = duration        # số slot (10 phút × n)
        
        # comfort constraint
        self.preferred_start = preferred_start
        self.preferred_end = preferred_end

    def __repr__(self):
        return f"{self.name}(id={self.id})"