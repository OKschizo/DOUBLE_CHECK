/**
 * Project terminology utilities
 * Provides dynamic terminology based on project type
 */

export type ProjectType = 'film' | 'commercial' | 'documentary' | 'episodic' | 'music_video' | 'photoshoot' | 'corporate' | 'custom' | undefined;

export interface ProjectTerminology {
  scenes: {
    singular: string;
    plural: string;
    label: string; // For UI labels
  };
  shots: {
    singular: string;
    plural: string;
    label: string;
  };
  cast: {
    label: string; // "Cast" or "Talent" or "Cast & Talent"
  };
}

const terminologyMap: Record<string, ProjectTerminology> = {
  photoshoot: {
    scenes: {
      singular: 'Look',
      plural: 'Looks',
      label: 'Looks & Sets',
    },
    shots: {
      singular: 'Photo',
      plural: 'Photos',
      label: 'Photos',
    },
    cast: {
      label: 'Talent',
    },
  },
  film: {
    scenes: {
      singular: 'Scene',
      plural: 'Scenes',
      label: 'Scenes & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Cast',
    },
  },
  commercial: {
    scenes: {
      singular: 'Scene',
      plural: 'Scenes',
      label: 'Scenes & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Cast',
    },
  },
  documentary: {
    scenes: {
      singular: 'Segment',
      plural: 'Segments',
      label: 'Segments & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Talent',
    },
  },
  episodic: {
    scenes: {
      singular: 'Scene',
      plural: 'Scenes',
      label: 'Scenes & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Cast',
    },
  },
  music_video: {
    scenes: {
      singular: 'Scene',
      plural: 'Scenes',
      label: 'Scenes & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Talent',
    },
  },
  corporate: {
    scenes: {
      singular: 'Segment',
      plural: 'Segments',
      label: 'Segments & Shots',
    },
    shots: {
      singular: 'Shot',
      plural: 'Shots',
      label: 'Shots',
    },
    cast: {
      label: 'Talent',
    },
  },
};

const defaultTerminology: ProjectTerminology = {
  scenes: {
    singular: 'Scene',
    plural: 'Scenes',
    label: 'Scenes & Shots',
  },
  shots: {
    singular: 'Shot',
    plural: 'Shots',
    label: 'Shots',
  },
  cast: {
    label: 'Cast',
  },
};

/**
 * Get project terminology based on project type
 */
export function getProjectTerminology(projectType?: ProjectType): ProjectTerminology {
  if (!projectType) {
    return defaultTerminology;
  }
  return terminologyMap[projectType] || defaultTerminology;
}

/**
 * Get scene terminology
 */
export function getSceneTerminology(projectType?: ProjectType) {
  return getProjectTerminology(projectType).scenes;
}

/**
 * Get shot terminology
 */
export function getShotTerminology(projectType?: ProjectType) {
  return getProjectTerminology(projectType).shots;
}

/**
 * Get cast label
 */
export function getCastLabel(projectType?: ProjectType): string {
  return getProjectTerminology(projectType).cast.label;
}

