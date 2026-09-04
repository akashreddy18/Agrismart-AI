# Import all the models, so that Base has them registered
# on its metadata before migrations are run or tables created.
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.farm import Farm  # noqa
from app.models.crop import Crop  # noqa
from app.models.expense import Expense  # noqa
from app.models.labour import Labour  # noqa
from app.models.logs import TractorConfig, FertilizerHistory, IrrigationHistory  # noqa
from app.models.sales import Sales  # noqa
from app.models.disease import DiseaseHistory  # noqa
