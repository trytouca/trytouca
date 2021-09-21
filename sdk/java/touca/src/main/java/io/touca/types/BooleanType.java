package io.touca.types;

public final class BooleanType extends ToucaType {
  private Boolean value;

  public BooleanType(final Boolean value) {
    this.value = value;
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.Boolean;
  }
}
